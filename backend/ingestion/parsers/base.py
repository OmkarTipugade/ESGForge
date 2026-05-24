"""
Abstract base parser.

All three source parsers (SAP, Utility, Travel) implement this interface.
The contract is simple: given a file path, return a list of parsed row dicts
and a list of error dicts. The caller (Celery task) handles creating
EmissionRecords from the parsed data.
"""

import abc
from dataclasses import dataclass, field
from decimal import Decimal


@dataclass
class ParsedRecord:
    """One successfully parsed row, ready to become an EmissionRecord."""

    row_number: int
    scope: str                    # SCOPE_1, SCOPE_2, SCOPE_3
    scope_3_category: int | None
    activity_type: str
    raw_quantity: Decimal
    raw_unit: str
    normalized_quantity: Decimal
    normalized_unit: str
    activity_start_date: str      # ISO format YYYY-MM-DD
    activity_end_date: str | None
    facility_sap_code: str        # For facility lookup; empty if N/A
    raw_data: dict                # Full original row
    emission_factor: Decimal | None = None
    emission_factor_source: str = ""
    co2e_kg: Decimal | None = None


@dataclass
class ParseError:
    """One row that failed to parse."""

    row_number: int
    error: str
    raw_data: dict = field(default_factory=dict)


class BaseParser(abc.ABC):
    """
    Base parser interface. Subclasses implement `parse()` which reads
    a file and returns parsed records + errors.
    """

    @abc.abstractmethod
    def parse(self, file_path: str) -> tuple[list[ParsedRecord], list[ParseError]]:
        """
        Parse the given file and return:
          - list of ParsedRecord (successfully parsed rows)
          - list of ParseError (rows that failed)
        """
        ...
