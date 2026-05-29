import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useLogin } from "@/hooks/useAuth";
import { Leaf, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { username, password },
      {
        onSuccess: () => {
          toast.success("Welcome back!");
          navigate("/dashboard");
        },
        onError: (err: any) => {
          toast.error(
            err.response?.data?.detail || "Invalid credentials",
          );
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden w-[480px] flex-col justify-between bg-slate-950 px-12 py-10 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            ESGForge
          </span>
        </div>

        <div>
          <h1 className="text-3xl font-bold leading-tight text-white">
            Carbon data ingestion
            <br />
            <span className="text-emerald-400">you can trust.</span>
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
            Upload, validate, review, and approve emission records from SAP,
            utility bills, and corporate travel — all in one enterprise-grade
            workspace.
          </p>
        </div>

        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} Breathe ESG
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 p-6 dark:bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
              <Leaf className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">ESGForge</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground">
            Sign in to your workspace
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your credentials to continue.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="login-username" className="text-foreground">
                Username
              </Label>
              <Input
                id="login-username"
                type="text"
                placeholder="analyst"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1.5"
                required
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="login-password" className="text-foreground">
                Password
              </Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {loginMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Need an account?{" "}
            <Link
              to="/register"
              className="font-medium text-emerald-600 underline underline-offset-2 hover:text-emerald-700"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
