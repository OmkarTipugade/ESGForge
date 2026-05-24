"""
Celery application for Breathe ESG.

Auto-discovers tasks from all installed Django apps.
"""

import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")

app = Celery("breathe_esg")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
