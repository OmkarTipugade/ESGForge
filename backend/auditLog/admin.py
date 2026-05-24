from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("record", "action", "field_name", "performed_by", "timestamp")
    list_filter = ("action",)
    readonly_fields = (
        "record",
        "action",
        "field_name",
        "old_value",
        "new_value",
        "performed_by",
        "timestamp",
        "ip_address",
    )

    def has_add_permission(self, request):
        return False  # Audit logs are system-created only

    def has_change_permission(self, request, obj=None):
        return False  # Immutable

    def has_delete_permission(self, request, obj=None):
        return False  # Immutable
