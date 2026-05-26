import hashlib

from rest_framework import serializers

from .models import DataSource


class DataSourceUploadSerializer(serializers.Serializer):
    """Serializer for the file upload endpoint."""

    file = serializers.FileField()
    source_type = serializers.ChoiceField(choices=DataSource.SOURCE_TYPE_CHOICES)

    def validate_file(self, value):
        # Validate file extension
        allowed = (".csv", ".xlsx", ".xls", ".tsv")
        name = value.name.lower()
        if not any(name.endswith(ext) for ext in allowed):
            raise serializers.ValidationError(
                f"Unsupported file type. Allowed: {', '.join(allowed)}"
            )
        return value


class DataSourceSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(
        source="uploaded_by.username", read_only=True
    )

    class Meta:
        model = DataSource
        fields = (
            "id",
            "source_type",
            "original_filename",
            "status",
            "total_rows",
            "successful_rows",
            "failed_rows",
            "error_summary",
            "error_categories",
            "processing_error",
            "uploaded_by_name",
            "uploaded_at",
            "processed_at",
        )
        read_only_fields = fields
