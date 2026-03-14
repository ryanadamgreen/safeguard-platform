"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Shield, AlertCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // If already signed in, redirect based on role
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        router.replace(data?.role === "platform_admin" ? "/admin" : "/dashboard");
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Redirect based on role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("email", email)
      .single();
    router.replace(profile?.role === "platform_admin" ? "/admin" : "/dashboard");
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#3730a3]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] px-4">
      {/* Back link */}
      <div className="w-full max-w-md mb-4">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1f2937] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </a>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#3730a3]">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-xl text-[#1f2937]">SafeGuard</CardTitle>
          <p className="text-sm text-gray-500">
            Children&apos;s home internet safety platform
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jane@safeguard.test"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Test credentials hint */}
          <div className="mt-4 rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">
              Test accounts:
            </p>
            <div className="space-y-1 text-xs text-gray-400">
              <p>
                <span className="font-mono">jane@safeguard.test</span> –
                Home Manager (both homes)
              </p>
              <p>
                <span className="font-mono">john@safeguard.test</span> –
                Home Manager (Meadow House)
              </p>
              <p>
                <span className="font-mono">admin@safeguard.test</span> –
                Platform Admin
              </p>
              <p className="pt-0.5">
                Password for all:{" "}
                <span className="font-mono">TestPass123!</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
