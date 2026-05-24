from django.conf import settings
from django.db import models


class EmissionRecord(models.Model):
    """
    Canonical normalized emission record. Every row ingested from any source
    (SAP, utility, travel) becomes exactly one EmissionRecord after parsing
    and normalization.

    Design principles:
    - Raw values are preserved alongside normalized values (audit trail)
    - The full original CSV row is stored in raw_data (source-of-truth)
    - source_row_number links back to the exact row in the uploaded file
    - DecimalField (not FloatField) to avoid IEEE 754 precision loss
    - Status workflow: PENDING → FLAGGED/APPROVED → LOCKED
      Once LOCKED, the record is immutable — no edits, no status changes.
    """

    SCOPE_CHOICES = [
        ("SCOPE_1", "Scope 1 - Direct Emissions"),
        ("SCOPE_2", "Scope 2 - Indirect (Purchased Energy)"),
        ("SCOPE_3", "Scope 3 - Other Indirect"),
    ]

    STATUS_CHOICES = [
        ("PENDING", "Pending Review"),
        ("FLAGGED", "Flagged - Suspicious"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
        ("LOCKED", "Locked for Audit"),
    ]

    # -- Provenance / Source-of-truth --
    company = models.ForeignKey(
        "company.Company",
        on_delete=models.CASCADE,
        related_name="emission_records",
    )
    source = models.ForeignKey(
        "dataSource.DataSource",
        on_delete=models.CASCADE,
        related_name="records",
    )
    source_row_number = models.IntegerField(
        help_text="1-indexed row number in the uploaded CSV",
    )

    # -- Classification --
    scope = models.CharField(max_length=10, choices=SCOPE_CHOICES)
    scope_3_category = models.IntegerField(
        null=True,
        blank=True,
        help_text="GHG Protocol Scope 3 category number (e.g. 6=Business Travel)",
    )
    activity_type = models.CharField(
        max_length=100,
        help_text="Canonical activity: diesel_combustion, electricity_grid, flight_economy, hotel_stay",
    )

    # -- Raw values (as-ingested, never modified) --
    raw_quantity = models.DecimalField(max_digits=16, decimal_places=4)
    raw_unit = models.CharField(max_length=50)

    # -- Normalized values --
    normalized_quantity = models.DecimalField(max_digits=16, decimal_places=4)
    normalized_unit = models.CharField(
        max_length=50,
        help_text="Canonical unit: kg, L, kWh, km, room_night",
    )

    # -- Emissions calculation --
    emission_factor = models.DecimalField(
        max_digits=12,
        decimal_places=6,
        null=True,
        blank=True,
    )
    emission_factor_source = models.CharField(
        max_length=200,
        blank=True,
        default="",
        help_text="Reference: 'EPA 2024 Table 1', 'DEFRA 2024'",
    )
    co2e_kg = models.DecimalField(
        max_digits=14,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Calculated emissions in kg CO2e",
    )

    # -- Temporal --
    activity_start_date = models.DateField()
    activity_end_date = models.DateField(
        null=True,
        blank=True,
        help_text="Billing period end for utilities; null for point-in-time activities",
    )

    # -- Facility linkage --
    facility = models.ForeignKey(
        "company.Facility",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="emission_records",
    )

    # -- Review workflow --
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING",
    )
    flag_reasons = models.JSONField(
        default=list,
        blank=True,
        help_text='List of reasons: ["estimated_read", "quantity_outlier"]',
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_records",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True, default="")

    # -- Full original row for audit --
    raw_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Complete original CSV row as a dict",
    )

    # -- Timestamps --
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["company", "status"]),
            models.Index(fields=["company", "scope"]),
            models.Index(fields=["source"]),
            models.Index(fields=["activity_start_date"]),
        ]

    def __str__(self):
        return (
            f"#{self.pk} {self.activity_type} "
            f"{self.normalized_quantity} {self.normalized_unit} "
            f"[{self.get_status_display()}]"
        )
