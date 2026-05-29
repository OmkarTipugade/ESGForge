import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { useRegister } from "@/hooks/useAuth";
import { Leaf, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [role, setRole] = useState<"ADMIN" | "ANALYST" | "VIEWER">("ANALYST");
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(
      {
        username,
        email,
        password,
        company_code: companyCode,
        role,
      },
      {
        onSuccess: () => {
          toast.success("Account created! Please sign in.");
          navigate("/login");
        },
        onError: (err: any) => {
          const data = err.response?.data;
          if (data) {
            const messages = Object.entries(data)
              .map(([key, val]) => {
                const msg = Array.isArray(val) ? val.join(", ") : String(val);
                return `${key}: ${msg}`;
              })
              .join("\n");
            toast.error(messages || "Registration failed");
          } else {
            toast.error("Registration failed");
          }
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
            Join your team's
            <br />
            <span className="text-emerald-400">carbon workspace.</span>
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
            Create your account and start ingesting, validating, and approving
            emission data with your organization.
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
            Create your account
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign up to access the workspace.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="reg-username">Username</Label>
              <Input
                id="reg-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1.5"
                required
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="reg-password">Password</Label>
              <Input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5"
                required
                minLength={8}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Minimum 8 characters
              </p>
            </div>

            <div>
              <Label htmlFor="reg-company">Company Code</Label>
              <Input
                id="reg-company"
                type="text"
                placeholder="breathe"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as typeof role)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="ANALYST">Analyst</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {registerMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-emerald-600 underline underline-offset-2 hover:text-emerald-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
