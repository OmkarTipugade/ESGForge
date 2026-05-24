from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Register a new user. Only admins can register new users."""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        if self.request.user.role != "ADMIN":
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can register new users")
        serializer.save()


class PublicRegisterView(generics.CreateAPIView):
    """
    Public registration — for initial setup / demo purposes.
    In production, this would be removed or protected.
    """

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    """Return the current authenticated user's profile."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
