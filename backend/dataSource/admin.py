from django.contrib import admin

from .models import DataSource


@admin.register(DataSource)
class DataSourceAdmin(admin.ModelAdmin):
    list_display = (
        "original_filename",
        "source_type",
        "company",
        "status",
        "total_rows",
        "successful_rows",
        "failed_rows",
        "uploaded_at",
    )
    list_filter = ("source_type", "status", "company")
    search_fields = ("original_filename",)
    readonly_fields = ("file_hash", "uploaded_at", "processed_at")
