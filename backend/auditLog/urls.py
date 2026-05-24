from django.urls import path

from . import views

urlpatterns = [
    path(
        "records/<int:record_id>/audit-log/",
        views.RecordAuditLogView.as_view(),
        name="record-audit-log",
    ),
]
