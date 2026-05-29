import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useMe } from "@/hooks/useAuth";

const ProtectedRoute: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Fetch user profile when authenticated
  useMe();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
