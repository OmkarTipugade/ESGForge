from django.db.models import Count, Sum, Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from auditLog.models import AuditLog
from .models import EmissionRecord
from .serializers import (
    BulkApproveSerializer,
    EmissionRecordDetailSerializer,
    EmissionRecordListSerializer,
    LockSerializer,
    ReviewActionSerializer,
)


def _get_client_ip(request):
    """Extract client IP from request."""
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    return xff.split(",")[0].strip() if xff else request.META.get("REMOTE_ADDR")


class EmissionRecordListView(generics.ListAPIView):
    """
    List emission records for the current user's company.
    Supports filtering by scope, status, source_type, date range.
    """

    serializer_class = EmissionRecordListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["scope", "status", "activity_type"]
    search_fields = ["activity_type"]
    ordering_fields = [
        "created_at",
        "activity_start_date",
        "co2e_kg",
        "normalized_quantity",
    ]

    def get_queryset(self):
        qs = EmissionRecord.objects.filter(
            company=self.request.user.company
        ).select_related("source", "facility")

        # Custom filters
        source_type = self.request.query_params.get("source_type")
        if source_type:
            qs = qs.filter(source__source_type=source_type)

        source_id = self.request.query_params.get("source_id")
        if source_id:
            qs = qs.filter(source_id=source_id)

        date_from = self.request.query_params.get("date_from")
        if date_from:
            qs = qs.filter(activity_start_date__gte=date_from)

        date_to = self.request.query_params.get("date_to")
        if date_to:
            qs = qs.filter(activity_start_date__lte=date_to)

        return qs


class EmissionRecordDetailView(generics.RetrieveAPIView):
    """Detail view with full raw_data and audit history."""

    serializer_class = EmissionRecordDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EmissionRecord.objects.filter(
            company=self.request.user.company
        ).select_related("source", "facility", "reviewer")


class ReviewView(APIView):
    """
    Approve, reject, or flag a single emission record.
    Only analysts and admins can review.
    """

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role not in ("ADMIN", "ANALYST"):
            return Response(
                {"error": "Only analysts and admins can review records"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            record = EmissionRecord.objects.get(
                pk=pk, company=request.user.company
            )
        except EmissionRecord.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if record.status == "LOCKED":
            return Response(
                {"error": "Record is locked for audit and cannot be modified"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ReviewActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data["action"]
        notes = serializer.validated_data.get("notes", "")

        old_status = record.status
        ip = _get_client_ip(request)

        if action == "APPROVE":
            record.status = "APPROVED"
            record.reviewer = request.user
            record.reviewed_at = timezone.now()
            record.review_notes = notes
            record.save()

            AuditLog.objects.create(
                record=record,
                action="APPROVED",
                old_value=old_status,
                new_value="APPROVED",
                performed_by=request.user,
                ip_address=ip,
            )

        elif action == "REJECT":
            record.status = "REJECTED"
            record.reviewer = request.user
            record.reviewed_at = timezone.now()
            record.review_notes = notes
            record.save()

            AuditLog.objects.create(
                record=record,
                action="REJECTED",
                old_value=old_status,
                new_value="REJECTED",
                performed_by=request.user,
                ip_address=ip,
            )

        elif action == "FLAG":
            record.status = "FLAGGED"
            flag_reasons = serializer.validated_data.get("flag_reasons", [])
            if flag_reasons:
                record.flag_reasons = flag_reasons
            record.reviewer = request.user
            record.reviewed_at = timezone.now()
            record.review_notes = notes
            record.save()

            AuditLog.objects.create(
                record=record,
                action="FLAGGED",
                old_value=old_status,
                new_value="FLAGGED",
                performed_by=request.user,
                ip_address=ip,
            )

        return Response(EmissionRecordDetailSerializer(record).data)


class BulkApproveView(APIView):
    """Approve multiple records at once."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role not in ("ADMIN", "ANALYST"):
            return Response(
                {"error": "Only analysts and admins can approve records"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = BulkApproveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        record_ids = serializer.validated_data["record_ids"]
        notes = serializer.validated_data.get("notes", "")

        records = EmissionRecord.objects.filter(
            pk__in=record_ids,
            company=request.user.company,
            status__in=["PENDING", "FLAGGED"],
        )

        now = timezone.now()
        ip = _get_client_ip(request)
        approved_count = 0

        for record in records:
            old_status = record.status
            record.status = "APPROVED"
            record.reviewer = request.user
            record.reviewed_at = now
            record.review_notes = notes
            record.save()

            AuditLog.objects.create(
                record=record,
                action="APPROVED",
                old_value=old_status,
                new_value="APPROVED",
                performed_by=request.user,
                ip_address=ip,
            )
            approved_count += 1

        return Response({
            "approved_count": approved_count,
            "requested_count": len(record_ids),
        })


class LockView(APIView):
    """
    Lock approved records for audit. This is irreversible.
    Only admins can lock records.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != "ADMIN":
            return Response(
                {"error": "Only admins can lock records for audit"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = LockSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        record_ids = serializer.validated_data["record_ids"]
        ip = _get_client_ip(request)

        records = EmissionRecord.objects.filter(
            pk__in=record_ids,
            company=request.user.company,
            status="APPROVED",
        )

        locked_count = 0
        for record in records:
            record.status = "LOCKED"
            record.save(update_fields=["status", "updated_at"])

            AuditLog.objects.create(
                record=record,
                action="LOCKED",
                old_value="APPROVED",
                new_value="LOCKED",
                performed_by=request.user,
                ip_address=ip,
            )
            locked_count += 1

        return Response({
            "locked_count": locked_count,
            "requested_count": len(record_ids),
        })


class DashboardSummaryView(APIView):
    """
    Summary stats for the review dashboard.
    Returns counts by scope, status, source type, and total CO2e.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = EmissionRecord.objects.filter(company=request.user.company)

        by_status = dict(
            qs.values_list("status")
            .annotate(count=Count("id"))
            .values_list("status", "count")
        )

        by_scope = dict(
            qs.values_list("scope")
            .annotate(count=Count("id"))
            .values_list("scope", "count")
        )

        by_source = dict(
            qs.values_list("source__source_type")
            .annotate(count=Count("id"))
            .values_list("source__source_type", "count")
        )

        total_co2e = qs.aggregate(total=Sum("co2e_kg"))["total"] or 0

        return Response({
            "total_records": qs.count(),
            "total_co2e_kg": float(total_co2e),
            "by_status": by_status,
            "by_scope": by_scope,
            "by_source_type": by_source,
        })
