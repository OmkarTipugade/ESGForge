from django.db import models

from company.models import Company
from dataSource.models import DataSource

# Create your models here.
class EmissionRecord(models.Model):

    CATEGORY_CHOICES = [
        ('SCOPE1', 'Scope 1'),
        ('SCOPE2', 'Scope 2'),
        ('SCOPE3', 'Scope 3'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('FLAGGED', 'Flagged'),
        ('APPROVED', 'Approved'),
    ]

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE
    )

    source = models.ForeignKey(
        DataSource,
        on_delete=models.CASCADE
    )

    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES
    )

    activity_type = models.CharField(max_length=255)

    quantity = models.FloatField()

    unit = models.CharField(max_length=50)

    normalized_quantity = models.FloatField()

    normalized_unit = models.CharField(max_length=50)

    emission_factor = models.FloatField()

    co2e = models.FloatField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )

    suspicious_reason = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

