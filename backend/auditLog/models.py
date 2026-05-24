from django.db import models

from emissionRecord.models import EmissionRecord

# Create your models here.
class AuditLog(models.Model):

    record = models.ForeignKey(
        EmissionRecord,
        on_delete=models.CASCADE
    )

    action = models.CharField(max_length=255)

    old_value = models.TextField(
        blank=True,
        null=True
    )

    new_value = models.TextField(
        blank=True,
        null=True
    )

    timestamp = models.DateTimeField(auto_now_add=True)