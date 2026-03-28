import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
  const { session, loading, role } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      navigate(role === "employee" ? "/self-service" : "/", { replace: true });
    }
  }, [loading, navigate, role, session]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0D1B4B" }}>
        <div style={{ color: "white", fontSize: "14px" }}>Loading...</div>
      </div>
    );
  }

  if (session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });

    setSubmitting(false);
    if (err) {
      setError(
        err.message === "Invalid login credentials"
          ? "Incorrect email or password. Please try again."
          : err.message,
      );
      return;
    }

    navigate("/", { replace: true });

  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.jpeg" alt="Whiterose" className="h-20 w-auto rounded-xl shadow-md" />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#2B3990]">Whiterose HRMIS</h1>
            <p className="text-sm text-muted-foreground mt-1">Whiterose Venyou Enterprises Ltd</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-card-foreground mb-4">Sign in to your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Email address</label>
              <Input
                type="email"
                autoComplete="email"
                placeholder="you@whiterose.co.ke"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Password</label>
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="........"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#2B3990] hover:bg-[#1e2a6e] text-white"
              disabled={submitting}
            >
              {submitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">Whiterose HRMIS | Mombasa, Kenya</p>
      </div>
    </div>
  );
}
