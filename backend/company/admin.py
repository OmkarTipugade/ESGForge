from django.contrib import admin

from .models import Company, Facility


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "created_at")
    search_fields = ("name", "code")


@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    list_display = ("name", "company", "sap_plant_code", "address")
    list_filter = ("company",)
    search_fields = ("name", "sap_plant_code", "address")
