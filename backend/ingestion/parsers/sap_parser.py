"""
SAP Fuel & Procurement CSV parser.

Handles flat-file CSV exports from SAP (ME2M, MB52, SE16N, or scheduled ABAP).
Real SAP exports are messy:
  - Dates in YYYYMMDD, DD.MM.YYYY, or MM/DD/YYYY depending on user locale
  - German decimal formatting (1.234,56 instead of 1,234.56)
  - Column headers may be SAP technical names (MATNR) or descriptions
  - Units use SAP codes (TO, L, GAL, KG)
  - Plant codes (WERKS) are opaque 4-digit numbers

This parser is built to tolerate these variations rather than reject the file
at the first unexpected format.
"""

import csv
import io
import re
from datetime import date, datetime
from decimal import Decimal

from ingestion.normalizers import compute_emissions, normalize_unit, parse_german_decimal

from .base import BaseParser, ParsedRecord, ParseError


# Maps SAP material descriptions (and common variants) to our activity types.
# In production, this would be a configurable mapping table per client.
MATERIAL_TO_ACTIVITY: dict[str, str] = {
    "diesel": "diesel_combustion",
    "dieselkraftstoff": "diesel_combustion",  # German
    "diesel fuel": "diesel_combustion",
    "hsd": "diesel_combustion",               # High Speed Diesel
    "gasoline": "gasoline_combustion",
    "petrol": "gasoline_combustion",
    "benzin": "gasoline_combustion",           # German
    "unleaded": "gasoline_combustion",
    "lpg": "lpg_combustion",
    "propane": "lpg_combustion",
    "flüssiggas": "lpg_combustion",            # German
    "natural gas": "natural_gas_combustion",
    "erdgas": "natural_gas_combustion",        # German
    "lng": "natural_gas_combustion",
    "cng": "natural_gas_combustion",
    "fuel oil": "fuel_oil_combustion",
    "heating oil": "fuel_oil_combustion",
    "heizöl": "fuel_oil_combustion",           # German
    "hfo": "fuel_oil_combustion",
}

# Common SAP column header variations. We normalize to canonical keys.
COLUMN_ALIASES: dict[str, list[str]] = {
    "BUKRS": ["bukrs", "company_code", "comp_code", "company code", "buchungskreis"],
    "WERKS": ["werks", "plant", "plant_code", "plant code", "werk"],
    "MATNR": ["matnr", "material", "material_number", "material number", "materialnummer"],
    "MAKTX": ["maktx", "material_description", "material description", "material_desc",
              "materialkurztext", "description", "brennstoff"],
    "MENGE": ["menge", "quantity", "qty", "amount", "menge_bestellt"],
    "MEINS": ["meins", "unit", "uom", "unit_of_measure", "mengeneinheit", "base_unit", "einheit"],
    "EBELN": ["ebeln", "purchase_order", "po_number", "po number", "bestellnummer"],
    "BUDAT": ["budat", "posting_date", "posting date", "buchungsdatum", "document_date", "date"],
    "LIFNR": ["lifnr", "vendor", "vendor_number", "supplier", "lieferant"],
    "WAERS": ["waers", "currency", "währung"],
    "NETWR": ["netwr", "net_value", "net value", "amount", "nettowert"],
}


def _resolve_columns(headers: list[str]) -> dict[str, str]:
    """
    Map actual CSV headers to canonical SAP field names.
    Returns { canonical_name: actual_header }
    """
    mapping = {}
    headers_lower = [h.strip().lower() for h in headers]

    for canonical, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in headers_lower:
                idx = headers_lower.index(alias)
                mapping[canonical] = headers[idx]
                break

    return mapping


def _parse_sap_date(value: str) -> date:
    """
    Try multiple date formats common in SAP exports.
    SAP users configure their date format per user profile, so the same
    company can have exports in different formats.
    """
    value = value.strip()

    formats = [
        "%Y%m%d",        # 20240315 (SAP internal)
        "%d.%m.%Y",      # 15.03.2024 (German)
        "%m/%d/%Y",      # 03/15/2024 (US)
        "%Y-%m-%d",      # 2024-03-15 (ISO)
        "%d-%m-%Y",      # 15-03-2024
        "%d/%m/%Y",      # 15/03/2024
        "%Y/%m/%d",      # 2024/03/15
        "%m-%d-%y",      # 03-15-24
        "%m/%d/%y",      # 03/15/24
        "%d-%m-%y",      # 15-03-24
        "%d/%m/%y",      # 15/03/24
    ]

    for fmt in formats:
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue

    raise ValueError(f"Cannot parse date: '{value}'")


def _identify_activity(material_desc: str, material_number: str) -> str:
    """
    Determine the fuel activity type from material description or number.
    Falls back to the material number if the description doesn't match.
    """
    desc_lower = material_desc.strip().lower()

    # Try exact and substring matches against known fuel terms
    for keyword, activity in MATERIAL_TO_ACTIVITY.items():
        if keyword in desc_lower:
            return activity

    # Try material number (some companies encode fuel type in the MATNR)
    matnr_lower = material_number.strip().lower()
    for keyword, activity in MATERIAL_TO_ACTIVITY.items():
        if keyword in matnr_lower:
            return activity

    # Default: if it's in a fuel procurement export, assume diesel
    # (the most common industrial fuel). Flag it for review.
    return "diesel_combustion"


class SAPFuelParser(BaseParser):
    """
    Parse SAP flat-file CSV exports for fuel procurement data.
    All fuel procurement = Scope 1 (direct combustion).
    """

    def parse(self, file_path: str) -> tuple[list[ParsedRecord], list[ParseError]]:
        records: list[ParsedRecord] = []
        errors: list[ParseError] = []

        with open(file_path, "r", encoding="utf-8-sig") as f:
            # Detect delimiter (SAP exports may use ; or , or \t)
            sample = f.read(4096)
            f.seek(0)
            dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
            reader = csv.DictReader(f, dialect=dialect)

            headers = reader.fieldnames or []
            col_map = _resolve_columns(headers)

            # Minimum required columns
            required = {"MENGE", "MEINS", "BUDAT"}
            missing = required - set(col_map.keys())
            if missing:
                errors.append(ParseError(
                    row_number=0,
                    error=f"Missing required columns: {missing}. Found headers: {headers}",
                ))
                return records, errors

            for row_num, row in enumerate(reader, start=2):  # row 1 is header
                try:
                    raw_data = dict(row)

                    # Extract values using column mapping
                    qty_str = row.get(col_map.get("MENGE", ""), "").strip()
                    unit_str = row.get(col_map.get("MEINS", ""), "").strip()
                    date_str = row.get(col_map.get("BUDAT", ""), "").strip()
                    material_desc = row.get(col_map.get("MAKTX", ""), "").strip()
                    material_num = row.get(col_map.get("MATNR", ""), "").strip()
                    plant_code = row.get(col_map.get("WERKS", ""), "").strip()

                    if not qty_str or not date_str:
                        errors.append(ParseError(
                            row_number=row_num,
                            error="Missing quantity or date",
                            raw_data=raw_data,
                        ))
                        continue

                    # Parse quantity (handle German decimals)
                    raw_quantity = parse_german_decimal(qty_str)
                    if raw_quantity <= 0:
                        errors.append(ParseError(
                            row_number=row_num,
                            error=f"Non-positive quantity: {raw_quantity}",
                            raw_data=raw_data,
                        ))
                        continue

                    # Default unit to L if missing (common SAP omission for liquids)
                    if not unit_str:
                        unit_str = "L"

                    # Parse date
                    activity_date = _parse_sap_date(date_str)

                    # Identify fuel type
                    activity_type = _identify_activity(material_desc, material_num)

                    # Normalize units
                    normalized_qty, normalized_unit = normalize_unit(raw_quantity, unit_str)

                    # Compute emissions
                    ef, co2e, ef_source = compute_emissions(
                        activity_type, normalized_qty, normalized_unit
                    )

                    records.append(ParsedRecord(
                        row_number=row_num,
                        scope="SCOPE_1",
                        scope_3_category=None,
                        activity_type=activity_type,
                        raw_quantity=raw_quantity,
                        raw_unit=unit_str,
                        normalized_quantity=normalized_qty,
                        normalized_unit=normalized_unit,
                        activity_start_date=activity_date.isoformat(),
                        activity_end_date=None,
                        facility_sap_code=plant_code,
                        raw_data=raw_data,
                        emission_factor=ef,
                        emission_factor_source=ef_source,
                        co2e_kg=co2e,
                    ))

                except Exception as exc:
                    errors.append(ParseError(
                        row_number=row_num,
                        error=str(exc),
                        raw_data=dict(row) if row else {},
                    ))

        return records, errors
