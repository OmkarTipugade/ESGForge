from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(
        source="performed_by.username", read_only=True, default="system"
    )

    class Meta:
        model = AuditLog
        fields = (
            "id",
            "record_id",
            "action",
            "field_name",
            "old_value",
            "new_value",
            "performed_by_name",
            "timestamp",
            "ip_address",
        )
