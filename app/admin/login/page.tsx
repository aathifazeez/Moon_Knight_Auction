"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid username or password");
    } else {
      router.push("/admin/dashboard");
      router.refresh();
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "var(--color-bg)" }}
    >
      {/* Ambient gold glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)",
        }}
      />

      <div
        className="relative w-full max-w-sm rounded-2xl border p-8 flex flex-col gap-6"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center"
            style={{ background: "var(--color-gold-dim)" }}
          >
            <Lock size={22} style={{ color: "var(--color-gold)" }} />
          </div>
          <div className="text-center">
            <h1
              className="font-display text-4xl tracking-wide leading-none"
              style={{ color: "var(--color-gold)" }}
            >
              ADMIN ACCESS
            </h1>
            <p className="text-xs mt-1 uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
              Moon Night Auction
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--color-text-muted)" }}
            >
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="Enter username"
              className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: "var(--color-surface-raised)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--color-text-muted)" }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: "var(--color-surface-raised)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>

          {/* Error */}
          {error && (
            <p
              className="text-xs text-center rounded-lg px-4 py-2.5"
              style={{
                color: "var(--color-error)",
                background: "var(--color-error-dim)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full py-3.5 rounded-lg font-display text-xl tracking-wider transition-all flex items-center justify-center gap-2 mt-1"
            style={{
              background: !username || !password || loading
                ? "var(--color-border)"
                : "var(--color-gold)",
              color: !username || !password || loading
                ? "var(--color-text-subtle)"
                : "var(--color-bg)",
              cursor: !username || !password || loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : "SIGN IN"}
          </button>
        </form>
      </div>
    </div>
  );
}
