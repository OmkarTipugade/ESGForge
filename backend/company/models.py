from django.db import models


class Company(models.Model):
    """
    Tenant entity. Every data record, user, and upload is scoped to a Company.

    The `code` field is a short identifier used in URLs and API filters
    (e.g., "acme", "globex"). It's unique and slugified.
    """

    name = models.CharField(max_length=255)
    code = models.CharField(
        max_length=50,
        unique=True,
        help_text="Short unique identifier, e.g. 'acme'",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "companies"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Facility(models.Model):
    """
    Maps physical locations to SAP plant codes and utility meter addresses.

    When SAP data arrives with WERKS='1000', we look up which Facility has
    sap_plant_code='1000' for this company. Same for utility data: we match
    the service_address to a Facility.

    This table is pre-populated during client onboarding so that the
    ingestion pipeline can auto-link records to facilities.
    """

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="facilities",
    )
    name = models.CharField(
        max_length=255,
        help_text="Human name: 'Chicago Manufacturing Plant'",
    )
    sap_plant_code = models.CharField(
        max_length=20,
        blank=True,
        default="",
        help_text="WERKS value from SAP, e.g. '1000'",
    )
    address = models.TextField(
        blank=True,
        default="",
        help_text="Physical address, used to match utility service addresses",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "facilities"
        unique_together = [("company", "sap_plant_code")]
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.company.code})"