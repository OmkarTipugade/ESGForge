from rest_framework import generics, permissions

from .models import AuditLog
from .serializers import AuditLogSerializer


class RecordAuditLogView(generics.ListAPIView):
    """List audit log entries for a specific emission record."""

    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        record_id = self.kwargs["record_id"]
        return AuditLog.objects.filter(
            record_id=record_id,
            record__company=self.request.user.company,
        ).select_related("performed_by")
