"""
Validation and auto-flagging logic.

After normalization, every EmissionRecord passes through validators
that check for suspicious data. Flagged records get status='FLAGGED'
and the reasons are stored in flag_reasons (JSON list).

Analysts can then review flagged records and either approve or reject them.
"""

from decimal import Decimal

from emissionRecord.models import EmissionRecord


# Thresholds for outlier detection.
# If a value exceeds MAX for its activity type, it gets flagged.
# These are deliberately conservative — false positives are better
# than silently passing bad data to auditors.
QUANTITY_THRESHOLDS: dict[str, dict[str, Decimal]] = {
    "diesel_combustion": {"max_L": Decimal("500000"), "min_L": Decimal("1")},
    "gasoline_combustion": {"max_L": Decimal("500000"), "min_L": Decimal("1")},
    "lpg_combustion": {"max_L": Decimal("200000"), "min_L": Decimal("1")},
    "natural_gas_combustion": {"max_m3": Decimal("1000000"), "min_m3": Decimal("1")},
    "electricity_grid": {"max_kWh": Decimal("10000000"), "min_kWh": Decimal("1")},
    "flight_economy": {"max_km": Decimal("20000"), "min_km": Decimal("50")},
    "flight_business": {"max_km": Decimal("20000"), "min_km": Decimal("50")},
    "flight_first": {"max_km": Decimal("20000"), "min_km": Decimal("50")},
    "flight_premium_economy": {"max_km": Decimal("20000"), "min_km": Decimal("50")},
    "hotel_stay": {"max_room_night": Decimal("90"), "min_room_night": Decimal("1")},
    "car_rental": {"max_km": Decimal("5000"), "min_km": Decimal("1")},
    "taxi": {"max_km": Decimal("500"), "min_km": Decimal("0.5")},
}


def validate_record(record: EmissionRecord) -> list[str]:
    """
    Run validation checks on a single EmissionRecord.
    Returns a list of flag reason strings (empty if no issues).
    Does NOT save the record — caller decides what to do.
    """
    flags: list[str] = []

    # 1. Quantity outlier check
    thresholds = QUANTITY_THRESHOLDS.get(record.activity_type)
    if thresholds:
        max_key = f"max_{record.normalized_unit}"
        min_key = f"min_{record.normalized_unit}"

        if max_key in thresholds and record.normalized_quantity > thresholds[max_key]:
            flags.append(
                f"quantity_outlier_high: {record.normalized_quantity} {record.normalized_unit} "
                f"exceeds threshold {thresholds[max_key]}"
            )
        if min_key in thresholds and record.normalized_quantity < thresholds[min_key]:
            flags.append(
                f"quantity_outlier_low: {record.normalized_quantity} {record.normalized_unit} "
                f"below threshold {thresholds[min_key]}"
            )

    # 2. Missing emission factor
    if record.emission_factor is None and record.co2e_kg is None:
        flags.append("missing_emission_factor: no factor found for this activity type")

    # 3. Negative quantity
    if record.normalized_quantity < 0:
        flags.append("negative_quantity: quantity is negative")

    # 4. Future date
    from django.utils import timezone

    if record.activity_start_date > timezone.now().date():
        flags.append("future_date: activity date is in the future")

    # 5. Estimated utility read
    raw_data = record.raw_data or {}
    read_type = raw_data.get("read_type", "").upper()
    if read_type == "ESTIMATED":
        flags.append("estimated_read: utility meter reading was estimated, not actual")

    return flags
