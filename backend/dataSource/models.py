from django.conf import settings
from django.db import models


class DataSource(models.Model):
    """
    Represents a single file upload / data ingestion event.

    Each upload produces one DataSource row. The file is stored on disk,
    hashed for deduplication, and processed asynchronously by Celery.
    The processing status and row-level errors are tracked here so the
    analyst can see "what happened" without digging into logs.
    """

    SOURCE_TYPE_CHOICES = [
        ("SAP_FUEL", "SAP Fuel & Procurement"),
        ("UTILITY_ELECTRICITY", "Utility Electricity"),
        ("TRAVEL", "Corporate Travel"),
    ]

    STATUS_CHOICES = [
        ("UPLOADED", "Uploaded"),
        ("PROCESSING", "Processing"),
        ("COMPLETED", "Completed"),
        ("FAILED", "Failed"),
        ("PARTIALLY_FAILED", "Partially Failed"),
    ]

    company = models.ForeignKey(
        "company.Company",
        on_delete=models.CASCADE,
        related_name="data_sources",
    )
    source_type = models.CharField(max_length=30, choices=SOURCE_TYPE_CHOICES)
    original_filename = models.CharField(max_length=500)
    raw_file = models.FileField(upload_to="uploads/%Y/%m/")

    # SHA-256 of the uploaded file. Prevents the same export from being
    # uploaded twice by a hurried facilities manager.
    file_hash = models.CharField(max_length=64, db_index=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="UPLOADED",
    )

    # Row-level processing stats, updated after parsing completes.
    total_rows = models.IntegerField(default=0)
    successful_rows = models.IntegerField(default=0)
    failed_rows = models.IntegerField(default=0)

    # Row-level error details: { "3": "Invalid date format", "17": "Missing unit" }
    error_summary = models.JSONField(default=dict, blank=True)

    # Aggregated parse-error counts by category. Values are always integers,
    # e.g. {"missing_columns": 5, "invalid_units": 2}.
    error_categories = models.JSONField(default=dict, blank=True)

    # Fatal / unexpected processing failure (not a row-level or category count).
    processing_error = models.TextField(blank=True, default="")

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploads",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-uploaded_at"]
        indexes = [
            models.Index(fields=["company", "source_type"]),
        ]

    def __str__(self):
        return f"{self.original_filename} ({self.get_source_type_display()})"