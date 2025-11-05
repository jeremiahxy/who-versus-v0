"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || email.split("@")[0],
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;

        setMessage(
          "Account created! Please check your email to verify your account."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary neon-text font-display">
          WhoVersus
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {mode === "signup" ? "Create an account" : "Sign in to your account"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Display Name (Optional)
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-primary/30 bg-card/50 px-4 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="How should we call you?"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-primary/30 bg-card/50 px-4 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-primary/30 bg-card/50 px-4 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="••••••••"
          />
          {mode === "signup" && (
            <p className="mt-1 text-xs text-muted-foreground">
              Must be at least 6 characters
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-lg border border-primary/50 bg-primary/10 px-4 py-3 text-sm text-primary">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-3 font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:neon-glow-subtle disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? mode === "signup"
              ? "Creating account..."
              : "Signing in..."
            : mode === "signup"
            ? "Sign Up"
            : "Sign In"}
        </button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <a
              href="/auth/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </a>
          </>
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <a
              href="/auth/signup"
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </a>
          </>
        )}
      </div>
    </div>
  );
}

