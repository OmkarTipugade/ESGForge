from rest_framework import viewsets, permissions

from .models import Company, Facility
from .serializers import CompanySerializer, FacilitySerializer


class CompanyViewSet(viewsets.ModelViewSet):
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Scope to the current user's company."""
        if self.request.user.is_superuser:
            return Company.objects.all()
        return Company.objects.filter(pk=self.request.user.company_id)


class FacilityViewSet(viewsets.ModelViewSet):
    serializer_class = FacilitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Facility.objects.filter(company=self.request.user.company)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)
