from django.test import TestCase

from ingestion.parsers.base import ParseError
from ingestion.tasks import build_parse_error_report, empty_error_categories


class BuildParseErrorReportTests(TestCase):
    def test_row_errors_only_in_error_summary(self):
        parse_errors = [
            ParseError(
                row_number=2,
                error="Cannot compute distance: PNQ→DEL (unknown airports)",
            ),
            ParseError(row_number=5, error="Unknown unit: xyz"),
        ]

        row_errors, categories = build_parse_error_report(parse_errors)

        self.assertEqual(
            row_errors,
            {
                "2": "Cannot compute distance: PNQ→DEL (unknown airports)",
                "5": "Unknown unit: xyz",
            },
        )
        self.assertEqual(categories["missing_columns"], 0)
        self.assertEqual(categories["invalid_units"], 1)
        # Row-level dict must not contain aggregate keys
        self.assertNotIn("missing_columns", row_errors)
        self.assertNotIn("invalid_units", row_errors)

    def test_missing_columns_classification(self):
        parse_errors = [
            ParseError(row_number=1, error="Missing required columns: quantity"),
        ]

        _, categories = build_parse_error_report(parse_errors)

        self.assertEqual(categories["missing_columns"], 1)
        self.assertEqual(categories["invalid_units"], 0)

    def test_empty_parse_errors(self):
        row_errors, categories = build_parse_error_report([])

        self.assertEqual(row_errors, {})
        self.assertEqual(
            categories, {"missing_columns": 0, "invalid_units": 0}
        )

    def test_error_categories_values_are_always_integers(self):
        _, categories = build_parse_error_report(
            [ParseError(row_number=1, error="Unknown unit: gal")]
        )
        for key, value in categories.items():
            self.assertIsInstance(value, int, msg=f"{key} should be int")

    def test_empty_error_categories_has_no_string_values(self):
        categories = empty_error_categories()
        self.assertEqual(categories, {"missing_columns": 0, "invalid_units": 0})
        self.assertNotIn("fatal", categories)
