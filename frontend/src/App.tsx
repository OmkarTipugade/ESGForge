import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Layout
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

// Auth pages
import LoginPage from "@/page/auth/LoginPage";
import RegisterPage from "@/page/auth/RegisterPage";

// App pages
import Dashboard from "@/pages/Dashboard";
import UploadPage from "@/pages/Upload";
import ReviewQueue from "@/pages/ReviewQueue";
import RecordDetail from "@/pages/RecordDetail";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontSize: "13px",
            borderRadius: "10px",
            padding: "12px 16px",
          },
        }}
      />

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/review" element={<ReviewQueue />} />
            <Route path="/records/:id" element={<RecordDetail />} />
          </Route>
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
