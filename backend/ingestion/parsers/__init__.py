from .base import BaseParser
from .sap_parser import SAPFuelParser
from .utility_parser import UtilityElectricityParser
from .travel_parser import TravelParser

PARSER_REGISTRY = {
    "SAP_FUEL": SAPFuelParser,
    "UTILITY_ELECTRICITY": UtilityElectricityParser,
    "TRAVEL": TravelParser,
}


def get_parser(source_type: str) -> BaseParser:
    """Get the appropriate parser for a given source type."""
    parser_class = PARSER_REGISTRY.get(source_type)
    if parser_class is None:
        raise ValueError(f"No parser registered for source type: {source_type}")
    return parser_class()
