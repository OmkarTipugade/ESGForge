from rest_framework import serializers

from auditLog.models import AuditLog
from .models import EmissionRecord


class EmissionRecordListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""

    source_type = serializers.CharField(source="source.source_type", read_only=True)
    source_filename = serializers.CharField(
        source="source.original_filename", read_only=True
    )
    facility_name = serializers.CharField(
        source="facility.name", read_only=True, default=None
    )

    class Meta:
        model = EmissionRecord
        fields = (
            "id",
            "scope",
            "scope_3_category",
            "activity_type",
            "raw_quantity",
            "raw_unit",
            "normalized_quantity",
            "normalized_unit",
            "co2e_kg",
            "activity_start_date",
            "activity_end_date",
            "status",
            "flag_reasons",
            "source_type",
            "source_filename",
            "facility_name",
            "created_at",
        )


class EmissionRecordDetailSerializer(serializers.ModelSerializer):
    """Full detail serializer including raw_data and audit history."""

    source_type = serializers.CharField(source="source.source_type", read_only=True)
    source_filename = serializers.CharField(
        source="source.original_filename", read_only=True
    )
    facility_name = serializers.CharField(
        source="facility.name", read_only=True, default=None
    )
    reviewer_name = serializers.CharField(
        source="reviewer.username", read_only=True, default=None
    )
    audit_history = serializers.SerializerMethodField()

    class Meta:
        model = EmissionRecord
        fields = (
            "id",
            "scope",
            "scope_3_category",
            "activity_type",
            "raw_quantity",
            "raw_unit",
            "normalized_quantity",
            "normalized_unit",
            "emission_factor",
            "emission_factor_source",
            "co2e_kg",
            "activity_start_date",
            "activity_end_date",
            "status",
            "flag_reasons",
            "reviewer_name",
            "reviewed_at",
            "review_notes",
            "source_type",
            "source_filename",
            "source_row_number",
            "facility_name",
            "raw_data",
            "audit_history",
            "created_at",
            "updated_at",
        )

    def get_audit_history(self, obj):
        logs = AuditLog.objects.filter(record=obj).order_by("-timestamp")[:20]
        return AuditLogSerializer(logs, many=True).data


class ReviewActionSerializer(serializers.Serializer):
    """Serializer for the review/approve/reject endpoint."""

    action = serializers.ChoiceField(
        choices=["APPROVE", "REJECT", "FLAG"],
        help_text="Action to take on the record",
    )
    notes = serializers.CharField(required=False, default="", allow_blank=True)
    flag_reasons = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
    )


class BulkApproveSerializer(serializers.Serializer):
    """Serializer for bulk approve endpoint."""

    record_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        max_length=500,
    )
    notes = serializers.CharField(required=False, default="", allow_blank=True)


class LockSerializer(serializers.Serializer):
    """Serializer for the lock-for-audit endpoint."""

    record_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        max_length=1000,
        help_text="IDs of approved records to lock",
    )


class AuditLogSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(
        source="performed_by.username", read_only=True, default="system"
    )

    class Meta:
        model = AuditLog
        fields = (
            "id",
            "action",
            "field_name",
            "old_value",
            "new_value",
            "performed_by_name",
            "timestamp",
        )
