"""
Utility electricity CSV parser.

Handles electricity invoice/meter data exports from utility providers
or energy management systems (e.g., EnergyCAP, Schneider EcoStruxure,
or manual exports from utility portals).

Key challenges:
  - Billing periods span date ranges, not single dates
  - Units vary: kWh, MWh, GWh, therms, GJ, MMBtu
  - Meter IDs may or may not map to specific facilities
  - Some exports include peak/off-peak breakdowns (we aggregate them)
  - Utility names are inconsistent across invoices

All electricity consumption = Scope 2 (purchased electricity).
"""

import csv
from datetime import date, datetime
from decimal import Decimal

from ingestion.normalizers import compute_emissions, normalize_unit, parse_german_decimal

from .base import BaseParser, ParsedRecord, ParseError


# Common column header variations across utility export formats
COLUMN_ALIASES: dict[str, list[str]] = {
    "meter_id": [
        "meter_id", "meter id", "meter_number", "meter number",
        "meter", "point_of_delivery", "pod", "mpan", "esid", "service_id",
    ],
    "facility": [
        "facility", "facility_name", "facility name", "site",
        "site_name", "site name", "building", "location", "address",
    ],
    "facility_code": [
        "facility_code", "facility code", "site_code", "site code",
        "sap_code", "werks", "plant_code", "plant code", "cost_center",
    ],
    "billing_start": [
        "billing_start", "billing_start_date", "billing start date",
        "period_start", "period start", "start_date", "start date",
        "service_from", "service from", "read_date_start", "from_date",
    ],
    "billing_end": [
        "billing_end", "billing_end_date", "billing end date",
        "period_end", "period end", "end_date", "end date",
        "service_to", "service to", "read_date_end", "to_date",
    ],
    "consumption": [
        "consumption", "usage", "quantity", "kwh", "energy",
        "total_kwh", "total_usage", "total_consumption",
        "amount_kwh", "energy_kwh", "demand", "total",
        "kwh_usage", "mwh_usage", "gwh_usage", "usage_kwh",
        "electricity_kwh", "electricity_usage", "energy_usage",
    ],
    "unit": [
        "unit", "uom", "unit_of_measure", "units", "energy_unit",
        "consumption_unit", "usage_unit",
    ],
    "utility_provider": [
        "utility_provider", "utility provider", "provider", "utility",
        "supplier", "vendor", "retailer", "utility_name", "company",
    ],
    "invoice_number": [
        "invoice_number", "invoice number", "invoice_no", "invoice",
        "bill_number", "bill number", "reference",
    ],
    "cost": [
        "cost", "amount", "total_cost", "total_amount",
        "charge", "bill_amount", "invoice_amount",
    ],
    "currency": [
        "currency", "currency_code", "curr",
    ],
}


def _resolve_columns(headers: list[str]) -> dict[str, str]:
    """
    Map actual CSV headers to canonical field names.
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


def _parse_date(value: str) -> date:
    """
    Try multiple date formats common in utility exports.
    """
    value = value.strip()

    formats = [
        "%Y-%m-%d",      # 2024-03-15 (ISO)
        "%m/%d/%Y",      # 03/15/2024 (US)
        "%m/%d/%y",      # 03/15/24
        "%d/%m/%Y",      # 15/03/2024
        "%d.%m.%Y",      # 15.03.2024 (European)
        "%Y%m%d",        # 20240315
        "%d-%m-%Y",      # 15-03-2024
        "%b %d, %Y",     # Mar 15, 2024
        "%B %d, %Y",     # March 15, 2024
        "%d %b %Y",      # 15 Mar 2024
    ]

    for fmt in formats:
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue

    raise ValueError(f"Cannot parse date: '{value}'")


def _infer_unit_from_header(col_map: dict[str, str]) -> str:
    """
    If there's no explicit unit column, try to infer from the
    consumption column header name (e.g., 'total_kwh' → 'kWh').
    """
    consumption_header = col_map.get("consumption", "").lower()
    if "mwh" in consumption_header:
        return "MWh"
    if "gwh" in consumption_header:
        return "GWh"
    if "kwh" in consumption_header:
        return "kWh"
    if "therm" in consumption_header:
        return "therms"
    if "gj" in consumption_header:
        return "GJ"
    # Default assumption for electricity
    return "kWh"


class UtilityElectricityParser(BaseParser):
    """
    Parse utility electricity CSV exports.
    All grid electricity consumption = Scope 2 (purchased electricity).
    """

    def parse(self, file_path: str) -> tuple[list[ParsedRecord], list[ParseError]]:
        records: list[ParsedRecord] = []
        errors: list[ParseError] = []

        with open(file_path, "r", encoding="utf-8-sig") as f:
            # Detect delimiter
            sample = f.read(4096)
            f.seek(0)
            dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
            reader = csv.DictReader(f, dialect=dialect)

            headers = reader.fieldnames or []
            col_map = _resolve_columns(headers)

            # Must have at least a consumption column and one date column
            if "consumption" not in col_map:
                errors.append(ParseError(
                    row_number=0,
                    error=f"Missing required consumption/usage column. Found headers: {headers}",
                ))
                return records, errors

            if "billing_start" not in col_map and "billing_end" not in col_map:
                errors.append(ParseError(
                    row_number=0,
                    error=f"Missing required date column (billing_start or billing_end). Found headers: {headers}",
                ))
                return records, errors

            # Determine default unit (from explicit column or inferred from header)
            default_unit = _infer_unit_from_header(col_map)

            for row_num, row in enumerate(reader, start=2):  # row 1 is header
                try:
                    raw_data = dict(row)

                    # Extract consumption
                    qty_str = row.get(col_map.get("consumption", ""), "").strip()
                    unit_str = row.get(col_map.get("unit", ""), "").strip()
                    start_str = row.get(col_map.get("billing_start", ""), "").strip()
                    end_str = row.get(col_map.get("billing_end", ""), "").strip()
                    facility_code = row.get(col_map.get("facility_code", ""), "").strip()

                    if not qty_str:
                        errors.append(ParseError(
                            row_number=row_num,
                            error="Missing consumption/usage value",
                            raw_data=raw_data,
                        ))
                        continue

                    # Parse quantity (handle German decimals, commas, etc.)
                    raw_quantity = parse_german_decimal(qty_str)
                    if raw_quantity <= 0:
                        errors.append(ParseError(
                            row_number=row_num,
                            error=f"Non-positive consumption: {raw_quantity}",
                            raw_data=raw_data,
                        ))
                        continue

                    # Use explicit unit or fallback to inferred default
                    if not unit_str:
                        unit_str = default_unit

                    # Parse dates
                    activity_start = None
                    activity_end = None

                    if start_str:
                        activity_start = _parse_date(start_str)
                    if end_str:
                        activity_end = _parse_date(end_str)

                    # If only end date provided, use it as start date too
                    if not activity_start and activity_end:
                        activity_start = activity_end
                    # If only start date provided, that's fine — end stays None
                    if not activity_start:
                        errors.append(ParseError(
                            row_number=row_num,
                            error="No valid date found",
                            raw_data=raw_data,
                        ))
                        continue

                    # Normalize units (convert MWh/GWh/therms → kWh)
                    normalized_qty, normalized_unit = normalize_unit(raw_quantity, unit_str)

                    # Compute emissions (Scope 2 = purchased electricity)
                    activity_type = "electricity_grid"
                    ef, co2e, ef_source = compute_emissions(
                        activity_type, normalized_qty, normalized_unit
                    )

                    records.append(ParsedRecord(
                        row_number=row_num,
                        scope="SCOPE_2",
                        scope_3_category=None,
                        activity_type=activity_type,
                        raw_quantity=raw_quantity,
                        raw_unit=unit_str,
                        normalized_quantity=normalized_qty,
                        normalized_unit=normalized_unit,
                        activity_start_date=activity_start.isoformat(),
                        activity_end_date=activity_end.isoformat() if activity_end else None,
                        facility_sap_code=facility_code,
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
