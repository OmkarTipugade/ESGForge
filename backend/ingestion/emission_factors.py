"""
Emission factors from EPA GHG Emission Factors Hub (2024) and UK DEFRA (2024).

Each factor converts an activity quantity in its canonical unit to kg CO2e.
We store the source reference so auditors can trace back to the published table.

In production, this would be a database table with versioning (factors change
yearly). For this prototype, a static dict is sufficient and honest.
"""

EMISSION_FACTORS = {
    # ---- Scope 1: Fuel combustion ----
    # Source: EPA Emission Factors Hub, Table 1 (2024)
    "diesel_combustion": {
        "factor": 2.68,       # kg CO2e per litre
        "unit": "L",
        "source": "EPA 2024 GHG Emission Factors Hub, Table 1",
    },
    "gasoline_combustion": {
        "factor": 2.31,       # kg CO2e per litre
        "unit": "L",
        "source": "EPA 2024 GHG Emission Factors Hub, Table 1",
    },
    "lpg_combustion": {
        "factor": 1.51,       # kg CO2e per litre
        "unit": "L",
        "source": "EPA 2024 GHG Emission Factors Hub, Table 1",
    },
    "natural_gas_combustion": {
        "factor": 2.02,       # kg CO2e per cubic metre
        "unit": "m3",
        "source": "EPA 2024 GHG Emission Factors Hub, Table 2",
    },
    "fuel_oil_combustion": {
        "factor": 2.96,       # kg CO2e per litre
        "unit": "L",
        "source": "EPA 2024 GHG Emission Factors Hub, Table 1",
    },

    # ---- Scope 2: Purchased electricity ----
    # Source: EPA eGRID 2024 US national average
    "electricity_grid": {
        "factor": 0.417,      # kg CO2e per kWh
        "unit": "kWh",
        "source": "EPA eGRID 2024, US national average",
    },

    # ---- Scope 3 Category 6: Business travel ----
    # Source: UK DEFRA Conversion Factors 2024
    "flight_economy": {
        "factor": 0.255,      # kg CO2e per passenger-km
        "unit": "km",
        "source": "DEFRA 2024 Business Travel - Air",
    },
    "flight_premium_economy": {
        "factor": 0.408,
        "unit": "km",
        "source": "DEFRA 2024 Business Travel - Air",
    },
    "flight_business": {
        "factor": 0.740,
        "unit": "km",
        "source": "DEFRA 2024 Business Travel - Air",
    },
    "flight_first": {
        "factor": 1.020,
        "unit": "km",
        "source": "DEFRA 2024 Business Travel - Air",
    },
    "hotel_stay": {
        "factor": 20.6,       # kg CO2e per room-night
        "unit": "room_night",
        "source": "DEFRA 2024 Hotel Stay",
    },
    "car_rental": {
        "factor": 0.171,      # kg CO2e per km
        "unit": "km",
        "source": "DEFRA 2024 Business Travel - Land",
    },
    "taxi": {
        "factor": 0.171,
        "unit": "km",
        "source": "DEFRA 2024 Business Travel - Taxi",
    },
    "rail": {
        "factor": 0.035,      # kg CO2e per passenger-km
        "unit": "km",
        "source": "DEFRA 2024 Business Travel - Rail",
    },
    "mileage_personal_car": {
        "factor": 0.214,      # kg CO2e per km (average car)
        "unit": "km",
        "source": "DEFRA 2024 Business Travel - Personal vehicle",
    },
}


def get_factor(activity_type: str) -> dict | None:
    """
    Look up emission factor for a given activity type.
    Returns dict with 'factor', 'unit', 'source' or None if not found.
    """
    return EMISSION_FACTORS.get(activity_type)
