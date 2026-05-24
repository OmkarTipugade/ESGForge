from rest_framework import serializers

from .models import Company, Facility


class FacilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Facility
        fields = ("id", "name", "sap_plant_code", "address", "created_at")
        read_only_fields = ("id", "created_at")


class CompanySerializer(serializers.ModelSerializer):
    facilities = FacilitySerializer(many=True, read_only=True)

    class Meta:
        model = Company
        fields = ("id", "name", "code", "created_at", "facilities")
        read_only_fields = ("id", "created_at")
