from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    company_code = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("username", "email", "password", "company_code", "role")

    def validate_company_code(self, value):
        from company.models import Company

        try:
            return Company.objects.get(code=value)
        except Company.DoesNotExist:
            raise serializers.ValidationError(f"No company with code '{value}'")

    def create(self, validated_data):
        company = validated_data.pop("company_code")
        password = validated_data.pop("password")
        user = User(**validated_data, company=company)
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.name", read_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "role", "company_name")
