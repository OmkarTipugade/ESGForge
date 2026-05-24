from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    """
    Immutable log of every state change on an EmissionRecord.

    This table is append-only — rows are never updated or deleted.
    Every approval, rejection, field edit, and lock action is recorded
    with who did it, when, and what changed.

    This is what auditors look at when they ask "who approved this
    and was anything modified after approval?"
    """

    ACTION_CHOICES = [
        ("CREATED", "Record Created"),
        ("STATUS_CHANGED", "Status Changed"),
        ("FIELD_EDITED", "Field Edited"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
        ("LOCKED", "Locked for Audit"),
        ("FLAGGED", "Auto-flagged"),
    ]

    record = models.ForeignKey(
        "emissionRecord.EmissionRecord",
        on_delete=models.CASCADE,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    field_name = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Which field was changed (for FIELD_EDITED actions)",
    )
    old_value = models.TextField(blank=True, default="")
    new_value = models.TextField(blank=True, default="")

    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="audit_actions",
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["record", "timestamp"]),
        ]

    def __str__(self):
        return f"{self.get_action_display()} on Record #{self.record_id} by {self.performed_by}"