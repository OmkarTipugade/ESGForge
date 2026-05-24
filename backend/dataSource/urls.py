from django.urls import path

from . import views

urlpatterns = [
    path("upload/", views.DataSourceUploadView.as_view(), name="datasource-upload"),
    path("", views.DataSourceListView.as_view(), name="datasource-list"),
    path("<int:pk>/", views.DataSourceDetailView.as_view(), name="datasource-detail"),
]
