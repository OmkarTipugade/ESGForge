"""
IATA airport code lookup for computing flight distances.

When travel data only gives us airport codes (e.g. "JFK" → "LAX") without
a distance, we compute great-circle distance using the Haversine formula.

This is a curated subset of ~100 major airports. In production, you'd use
the OpenFlights dataset (~7000 airports) or an API. For a prototype, this
covers the airports that appear in 95% of corporate travel.
"""

import math

# { IATA_CODE: (latitude, longitude) }
AIRPORTS = {
    # North America
    "ATL": (33.6407, -84.4277),
    "ORD": (41.9742, -87.9073),
    "DFW": (32.8998, -97.0403),
    "DEN": (39.8561, -104.6737),
    "JFK": (40.6413, -73.7781),
    "LAX": (33.9416, -118.4085),
    "SFO": (37.6213, -122.3790),
    "SEA": (47.4502, -122.3088),
    "MIA": (25.7959, -80.2870),
    "BOS": (42.3656, -71.0096),
    "EWR": (40.6895, -74.1745),
    "IAH": (29.9902, -95.3368),
    "MSP": (44.8848, -93.2223),
    "DTW": (42.2124, -83.3534),
    "PHL": (39.8744, -75.2424),
    "LGA": (40.7769, -73.8740),
    "DCA": (38.8512, -77.0402),
    "IAD": (38.9531, -77.4565),
    "SAN": (32.7336, -117.1897),
    "PHX": (33.4373, -112.0078),
    "YYZ": (43.6777, -79.6248),
    "YVR": (49.1967, -123.1815),
    "MEX": (19.4363, -99.0721),

    # Europe
    "LHR": (51.4700, -0.4543),
    "CDG": (49.0097, 2.5479),
    "FRA": (50.0379, 8.5622),
    "AMS": (52.3105, 4.7683),
    "MAD": (40.4983, -3.5676),
    "BCN": (41.2974, 2.0833),
    "FCO": (41.8003, 12.2389),
    "MUC": (48.3538, 11.7861),
    "ZRH": (47.4647, 8.5492),
    "LGW": (51.1537, -0.1821),
    "DUB": (53.4264, -6.2499),
    "CPH": (55.6180, 12.6561),
    "OSL": (60.1976, 11.1004),
    "ARN": (59.6519, 17.9186),
    "HEL": (60.3172, 24.9633),
    "VIE": (48.1103, 16.5697),
    "IST": (41.2753, 28.7519),
    "BRU": (50.9014, 4.4844),

    # Asia
    "HND": (35.5494, 139.7798),
    "NRT": (35.7720, 140.3929),
    "PEK": (40.0799, 116.6031),
    "PVG": (31.1443, 121.8083),
    "HKG": (22.3080, 113.9185),
    "SIN": (1.3644, 103.9915),
    "ICN": (37.4602, 126.4407),
    "BKK": (13.6900, 100.7501),
    "DEL": (28.5562, 77.1000),
    "BOM": (19.0896, 72.8656),
    "BLR": (13.1986, 77.7066),
    "HYD": (17.2403, 78.4294),
    "MAA": (12.9941, 80.1709),
    "CCU": (22.6520, 88.4463),
    "KUL": (2.7456, 101.7099),
    "TPE": (25.0777, 121.2330),

    # Middle East
    "DXB": (25.2532, 55.3657),
    "DOH": (25.2731, 51.6081),
    "AUH": (24.4439, 54.6511),

    # Oceania
    "SYD": (-33.9399, 151.1753),
    "MEL": (-37.6690, 144.8410),
    "AKL": (-37.0082, 174.7850),

    # South America
    "GRU": (-23.4356, -46.4731),
    "EZE": (-34.8222, -58.5358),
    "BOG": (4.7016, -74.1469),
    "SCL": (-33.3930, -70.7858),
    "LIM": (-12.0219, -77.1143),

    # Africa
    "JNB": (-26.1392, 28.2460),
    "CPT": (-33.9649, 18.6017),
    "CAI": (30.1219, 31.4056),
    "NBO": (-1.3192, 36.9278),
    "LOS": (6.5774, 3.3211),
}


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Compute great-circle distance between two points on Earth using
    the Haversine formula. Returns distance in kilometres.

    This is an approximation (~0.5% error vs geodesic) but good enough
    for emission factor calculation. Airlines use great-circle + a ~9%
    uplift for non-direct routing; we don't apply the uplift here because
    DEFRA factors already account for average circuity.
    """
    R = 6371.0  # Earth radius in km

    lat1_r, lon1_r = math.radians(lat1), math.radians(lon1)
    lat2_r, lon2_r = math.radians(lat2), math.radians(lon2)

    dlat = lat2_r - lat1_r
    dlon = lon2_r - lon1_r

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def compute_distance(origin: str, destination: str) -> float | None:
    """
    Compute distance in km between two IATA airport codes.
    Returns None if either airport is not in our lookup table.
    """
    origin = origin.strip().upper()
    destination = destination.strip().upper()

    if origin not in AIRPORTS or destination not in AIRPORTS:
        return None

    lat1, lon1 = AIRPORTS[origin]
    lat2, lon2 = AIRPORTS[destination]

    return round(haversine_km(lat1, lon1, lat2, lon2), 1)
