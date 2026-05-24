from django.contrib import admin

from .models import EmissionRecord


@admin.register(EmissionRecord)
class EmissionRecordAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "activity_type",
        "scope",
        "normalized_quantity",
        "normalized_unit",
        "co2e_kg",
        "status",
        "company",
        "activity_start_date",
    )
    list_filter = ("scope", "status", "company", "source__source_type")
    search_fields = ("activity_type",)
    readonly_fields = ("raw_quantity", "raw_unit", "raw_data", "source_row_number")
