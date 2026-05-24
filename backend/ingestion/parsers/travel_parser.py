"""
Corporate travel CSV parser.

Handles Concur/Navan Standard Accounting Extract (SAE) CSV files.
Travel data has multiple expense types in one file: flights, hotels,
ground transport. Each maps to a different emission factor.

Key challenges:
  - Distance often missing for flights — we compute from airport codes
  - Hotels are measured in room-nights, not distance
  - Mixed expense types need different handling
  - Cabin class affects emission factors significantly
"""

import csv
from datetime import date, datetime
from decimal import Decimal

from ingestion.iata_airports import compute_distance
from ingestion.normalizers import compute_emissions, normalize_unit

from .base import BaseParser, ParsedRecord, ParseError

COLUMN_ALIASES: dict[str, list[str]] = {
    "report_id": ["report_id", "report id", "expense_report_id", "report_number"],
    "employee_name": ["employee_name", "employee name", "traveler", "traveller", "name"],
    "employee_id": ["employee_id", "employee id", "emp_id"],
    "expense_type": ["expense_type", "expense type", "category", "type", "expense_category"],
    "transaction_date": ["transaction_date", "transaction date", "date", "travel_date", "expense_date"],
    "vendor_name": ["vendor_name", "vendor name", "vendor", "merchant", "supplier"],
    "origin": ["origin_city", "origin", "from_city", "departure", "from", "origin_airport"],
    "destination": ["destination_city", "destination", "to_city", "arrival", "to", "destination_airport"],
    "cabin_class": ["cabin_class", "cabin class", "class", "flight_class", "travel_class", "cabin"],
    "distance_km": ["distance_km", "distance", "miles", "flight_miles", "km", "distance_miles"],
    "amount": ["amount", "total", "cost", "transaction_amount", "expense_amount"],
    "currency": ["currency", "currency_code", "curr"],
    "nights": ["nights", "num_nights", "number_of_nights", "hotel_nights", "duration_nights"],
}

EXPENSE_TYPE_MAP: dict[str, str] = {
    "airfare": "flight",
    "air": "flight",
    "flight": "flight",
    "air ticket": "flight",
    "hotel": "hotel",
    "lodging": "hotel",
    "accommodation": "hotel",
    "car_rental": "car_rental",
    "car rental": "car_rental",
    "rental car": "car_rental",
    "rail": "rail",
    "train": "rail",
    "taxi": "taxi",
    "ride": "taxi",
    "uber": "taxi",
    "lyft": "taxi",
    "ground transport": "taxi",
    "ground_transport": "taxi",
    "mileage": "mileage",
    "personal car": "mileage",
    "personal_car": "mileage",
}

CABIN_CLASS_MAP: dict[str, str] = {
    "economy": "economy",
    "coach": "economy",
    "y": "economy",
    "premium economy": "premium_economy",
    "premium_economy": "premium_economy",
    "w": "premium_economy",
    "business": "business",
    "j": "business",
    "first": "first",
    "f": "first",
}


def _resolve_columns(headers: list[str]) -> dict[str, str]:
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
    value = value.strip()
    for fmt in ["%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y", "%d/%m/%Y", "%d-%m-%Y", "%Y%m%d"]:
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Cannot parse date: '{value}'")


def _get_activity_type(expense_category: str, cabin: str) -> str:
    if expense_category == "flight":
        cabin_key = CABIN_CLASS_MAP.get(cabin.strip().lower(), "economy")
        return f"flight_{cabin_key}"
    elif expense_category == "hotel":
        return "hotel_stay"
    elif expense_category == "car_rental":
        return "car_rental"
    elif expense_category == "rail":
        return "rail"
    elif expense_category == "taxi":
        return "taxi"
    elif expense_category == "mileage":
        return "mileage_personal_car"
    return "taxi"  # default fallback


class TravelParser(BaseParser):
    """Parse Concur/Navan travel expense CSV. All rows = Scope 3 Cat 6."""

    def parse(self, file_path: str) -> tuple[list[ParsedRecord], list[ParseError]]:
        records: list[ParsedRecord] = []
        errors: list[ParseError] = []

        with open(file_path, "r", encoding="utf-8-sig") as f:
            sample = f.read(4096)
            f.seek(0)
            dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
            reader = csv.DictReader(f, dialect=dialect)

            headers = reader.fieldnames or []
            col_map = _resolve_columns(headers)

            required = {"expense_type", "transaction_date"}
            missing = required - set(col_map.keys())
            if missing:
                errors.append(ParseError(
                    row_number=0,
                    error=f"Missing required columns: {missing}. Found: {headers}",
                ))
                return records, errors

            for row_num, row in enumerate(reader, start=2):
                try:
                    raw_data = dict(row)

                    expense_str = row.get(col_map.get("expense_type", ""), "").strip()
                    date_str = row.get(col_map.get("transaction_date", ""), "").strip()
                    origin = row.get(col_map.get("origin", ""), "").strip()
                    destination = row.get(col_map.get("destination", ""), "").strip()
                    cabin = row.get(col_map.get("cabin_class", ""), "").strip()
                    dist_str = row.get(col_map.get("distance_km", ""), "").strip()
                    nights_str = row.get(col_map.get("nights", ""), "").strip()

                    if not expense_str or not date_str:
                        errors.append(ParseError(row_number=row_num, error="Missing expense type or date", raw_data=raw_data))
                        continue

                    expense_category = EXPENSE_TYPE_MAP.get(expense_str.lower(), "")
                    if not expense_category:
                        errors.append(ParseError(row_number=row_num, error=f"Unknown expense type: '{expense_str}'", raw_data=raw_data))
                        continue

                    activity_date = _parse_date(date_str)
                    activity_type = _get_activity_type(expense_category, cabin)

                    # Determine quantity and unit based on expense category
                    if expense_category == "hotel":
                        if nights_str:
                            raw_quantity = Decimal(nights_str)
                        else:
                            raw_quantity = Decimal("1")
                        raw_unit = "room_night"
                    elif expense_category in ("flight", "car_rental", "rail", "taxi", "mileage"):
                        if dist_str:
                            cleaned = dist_str.replace(",", "")
                            raw_quantity = Decimal(cleaned)
                            raw_unit = "km"
                            if col_map.get("distance_km", "").lower() in ("miles", "flight_miles", "distance_miles"):
                                raw_unit = "mi"
                        elif origin and destination:
                            distance = compute_distance(origin, destination)
                            if distance is not None:
                                raw_quantity = Decimal(str(distance))
                                raw_unit = "km"
                            else:
                                errors.append(ParseError(row_number=row_num, error=f"Cannot compute distance: {origin}→{destination} (unknown airports)", raw_data=raw_data))
                                continue
                        else:
                            errors.append(ParseError(row_number=row_num, error="No distance and no airport codes for distance calculation", raw_data=raw_data))
                            continue
                    else:
                        errors.append(ParseError(row_number=row_num, error=f"Unhandled category: {expense_category}", raw_data=raw_data))
                        continue

                    normalized_qty, normalized_unit = normalize_unit(raw_quantity, raw_unit)
                    ef, co2e, ef_source = compute_emissions(activity_type, normalized_qty, normalized_unit)

                    records.append(ParsedRecord(
                        row_number=row_num,
                        scope="SCOPE_3",
                        scope_3_category=6,
                        activity_type=activity_type,
                        raw_quantity=raw_quantity,
                        raw_unit=raw_unit,
                        normalized_quantity=normalized_qty,
                        normalized_unit=normalized_unit,
                        activity_start_date=activity_date.isoformat(),
                        activity_end_date=None,
                        facility_sap_code="",
                        raw_data=raw_data,
                        emission_factor=ef,
                        emission_factor_source=ef_source,
                        co2e_kg=co2e,
                    ))

                except Exception as exc:
                    errors.append(ParseError(row_number=row_num, error=str(exc), raw_data=dict(row) if row else {}))

        return records, errors
