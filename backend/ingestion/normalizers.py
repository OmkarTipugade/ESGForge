"""
Unit normalization engine.

Converts raw quantities from various source units into canonical units:
  - Fuel volumes → litres (L)
  - Fuel masses  → kilograms (kg)
  - Electricity  → kilowatt-hours (kWh)
  - Distance     → kilometres (km)
  - Hotel stays  → room-nights (room_night)

Also applies emission factors to compute CO2e in kg.
"""

from decimal import Decimal, InvalidOperation

from .emission_factors import get_factor


# Maps (raw_unit_lowercase) → (canonical_unit, multiplier_to_canonical)
UNIT_CONVERSIONS: dict[str, tuple[str, Decimal]] = {
    # Volume → litres
    "l": ("L", Decimal("1")),
    "ltr": ("L", Decimal("1")),
    "litre": ("L", Decimal("1")),
    "litres": ("L", Decimal("1")),
    "liter": ("L", Decimal("1")),
    "liters": ("L", Decimal("1")),
    "gal": ("L", Decimal("3.78541")),
    "gallon": ("L", Decimal("3.78541")),
    "gallons": ("L", Decimal("3.78541")),
    "us_gal": ("L", Decimal("3.78541")),
    "imp_gal": ("L", Decimal("4.54609")),
    "m3": ("m3", Decimal("1")),
    "cbm": ("m3", Decimal("1")),

    # Mass → kilograms
    "kg": ("kg", Decimal("1")),
    "kgs": ("kg", Decimal("1")),
    "kilogram": ("kg", Decimal("1")),
    "kilograms": ("kg", Decimal("1")),
    "to": ("kg", Decimal("1000")),       # SAP metric ton code
    "t": ("kg", Decimal("1000")),
    "ton": ("kg", Decimal("1000")),
    "tonne": ("kg", Decimal("1000")),
    "mt": ("kg", Decimal("1000")),
    "lb": ("kg", Decimal("0.453592")),
    "lbs": ("kg", Decimal("0.453592")),
    "pound": ("kg", Decimal("0.453592")),
    "pounds": ("kg", Decimal("0.453592")),

    # Energy → kWh
    "kwh": ("kWh", Decimal("1")),
    "kw-h": ("kWh", Decimal("1")),
    "mwh": ("kWh", Decimal("1000")),
    "gwh": ("kWh", Decimal("1000000")),
    "therm": ("kWh", Decimal("29.3001")),
    "therms": ("kWh", Decimal("29.3001")),
    "gj": ("kWh", Decimal("277.778")),
    "mj": ("kWh", Decimal("0.277778")),
    "mmbtu": ("kWh", Decimal("293.071")),
    "btu": ("kWh", Decimal("0.000293071")),

    # Distance → km
    "km": ("km", Decimal("1")),
    "mi": ("km", Decimal("1.60934")),
    "mile": ("km", Decimal("1.60934")),
    "miles": ("km", Decimal("1.60934")),
    "nmi": ("km", Decimal("1.852")),       # nautical miles

    # Hotel
    "night": ("room_night", Decimal("1")),
    "nights": ("room_night", Decimal("1")),
    "room_night": ("room_night", Decimal("1")),
    "room_nights": ("room_night", Decimal("1")),
    "room-night": ("room_night", Decimal("1")),
    "room-nights": ("room_night", Decimal("1")),
}


def normalize_unit(raw_quantity: Decimal, raw_unit: str) -> tuple[Decimal, str]:
    """
    Convert a raw quantity + unit into canonical form.

    Returns (normalized_quantity, canonical_unit).
    Raises ValueError if the unit is not recognized.
    """
    key = raw_unit.strip().lower()
    if key not in UNIT_CONVERSIONS:
        raise ValueError(f"Unknown unit: '{raw_unit}'")

    canonical_unit, multiplier = UNIT_CONVERSIONS[key]
    normalized_quantity = raw_quantity * multiplier
    return normalized_quantity, canonical_unit


def compute_emissions(
    activity_type: str,
    normalized_quantity: Decimal,
    normalized_unit: str,
) -> tuple[Decimal | None, Decimal | None, str]:
    """
    Look up emission factor for the given activity type and compute CO2e.

    Returns (emission_factor, co2e_kg, factor_source).
    Returns (None, None, "") if no factor found.
    """
    factor_data = get_factor(activity_type)
    if factor_data is None:
        return None, None, ""

    # Sanity check: the normalized unit should match what the factor expects
    expected_unit = factor_data["unit"]
    if normalized_unit != expected_unit:
        # Unit mismatch — this is a programming error in the parser,
        # not user data error. Log it but don't crash.
        return None, None, f"Unit mismatch: expected {expected_unit}, got {normalized_unit}"

    factor = Decimal(str(factor_data["factor"]))
    co2e_kg = normalized_quantity * factor

    return factor, co2e_kg, factor_data["source"]


def parse_german_decimal(value: str) -> Decimal:
    """
    Parse a number that may use German locale formatting.
    German: 1.234,56 (period = thousands, comma = decimal)
    English: 1,234.56 (comma = thousands, period = decimal)

    Heuristic: if the string contains both ',' and '.', the last
    separator is the decimal separator.
    """
    value = value.strip()
    if not value:
        raise ValueError("Empty value")

    has_comma = "," in value
    has_period = "." in value

    if has_comma and has_period:
        # Both present: last one is the decimal separator
        last_comma = value.rfind(",")
        last_period = value.rfind(".")
        if last_comma > last_period:
            # German format: 1.234,56
            value = value.replace(".", "").replace(",", ".")
        else:
            # English format: 1,234.56
            value = value.replace(",", "")
    elif has_comma and not has_period:
        # Could be German decimal (3,5) or English thousands (1,000)
        # Heuristic: if there's exactly one comma and <=2 digits after it,
        # treat as decimal separator
        parts = value.split(",")
        if len(parts) == 2 and len(parts[1]) <= 2:
            value = value.replace(",", ".")
        else:
            value = value.replace(",", "")
    # If only period or neither, it's already fine for Decimal()

    try:
        return Decimal(value)
    except InvalidOperation:
        raise ValueError(f"Cannot parse number: '{value}'")
