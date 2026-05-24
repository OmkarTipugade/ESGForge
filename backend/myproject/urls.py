"""
Root URL configuration for Breathe ESG.

No /api/ prefix — endpoints are mounted directly:
  /auth/...       → JWT auth
  /sources/...    → file uploads
  /records/...    → emission records & review
  /companies/...  → tenant management
  etc.
"""

from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    # Auth
    path("auth/", include("users.urls")),

    # Company & Facilities
    path("", include("company.urls")),

    # Data source uploads
    path("sources/", include("dataSource.urls")),

    # Emission records, review, dashboard
    path("records/", include("emissionRecord.urls")),

    # Audit logs
    path("", include("auditLog.urls")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
