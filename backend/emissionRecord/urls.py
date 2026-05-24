from django.urls import path

from . import views

urlpatterns = [
    path("", views.EmissionRecordListView.as_view(), name="record-list"),
    path("<int:pk>/", views.EmissionRecordDetailView.as_view(), name="record-detail"),
    path("<int:pk>/review/", views.ReviewView.as_view(), name="record-review"),
    path("bulk-approve/", views.BulkApproveView.as_view(), name="record-bulk-approve"),
    path("lock/", views.LockView.as_view(), name="record-lock"),
    path("dashboard/", views.DashboardSummaryView.as_view(), name="dashboard-summary"),
]
