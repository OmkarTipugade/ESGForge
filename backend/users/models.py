from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model. Every user belongs to exactly one company (tenant)
    and has a role that controls what they can do.

    Multi-tenancy is enforced at the view layer by filtering querysets
    on request.user.company. We chose row-level filtering over
    schema-per-tenant because it's simpler to operate and sufficient
    for the number of tenants we expect (dozens, not thousands).
    """

    ROLE_CHOICES = [
        ("ADMIN", "Admin"),
        ("ANALYST", "Analyst"),
        ("VIEWER", "Viewer"),
    ]

    company = models.ForeignKey(
        "company.Company",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="users",
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="VIEWER",
    )

    class Meta:
        db_table = "users_user"

    def __str__(self):
        return f"{self.username} ({self.get_role_display()} @ {self.company})"
