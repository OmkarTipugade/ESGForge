import hashlib

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ingestion.tasks import process_upload

from .models import DataSource
from .serializers import DataSourceSerializer, DataSourceUploadSerializer


class DataSourceUploadView(APIView):
    """
    Upload a CSV file for ingestion.

    Accepts multipart/form-data with:
      - file: the CSV file
      - source_type: SAP_FUEL | UTILITY_ELECTRICITY | TRAVEL

    The file is saved, hashed for dedup, and a Celery task is dispatched
    for async processing.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = DataSourceUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uploaded_file = serializer.validated_data["file"]
        source_type = serializer.validated_data["source_type"]

        # Compute file hash for dedup
        hasher = hashlib.sha256()
        for chunk in uploaded_file.chunks():
            hasher.update(chunk)
        file_hash = hasher.hexdigest()
        uploaded_file.seek(0)  # Reset after hashing

        # Check for duplicate
        if DataSource.objects.filter(
            company=request.user.company, file_hash=file_hash
        ).exists():
            return Response(
                {"error": "This file has already been uploaded."},
                status=status.HTTP_409_CONFLICT,
            )

        # Create DataSource
        ds = DataSource.objects.create(
            company=request.user.company,
            source_type=source_type,
            original_filename=uploaded_file.name,
            raw_file=uploaded_file,
            file_hash=file_hash,
            uploaded_by=request.user,
        )

        # Process the file synchronously so Postman/API gets immediate results
        process_upload(ds.pk, request.user.pk)
        ds.refresh_from_db()

        return Response(
            DataSourceSerializer(ds).data,
            status=status.HTTP_201_CREATED,
        )


class DataSourceListView(generics.ListAPIView):
    """List all uploads for the current user's company."""

    serializer_class = DataSourceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["source_type", "status"]

    def get_queryset(self):
        return DataSource.objects.filter(company=self.request.user.company)


class DataSourceDetailView(generics.RetrieveAPIView):
    """Detail view for a single upload, including error summary."""

    serializer_class = DataSourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DataSource.objects.filter(company=self.request.user.company)
