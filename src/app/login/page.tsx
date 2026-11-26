
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Invalid email or password.");
        return;
      }

      setSuccess("Login successful! Redirecting...");

      const nextParam = new URLSearchParams(window.location.search).get("next");
      let safeNext: string | null = null;

      if (nextParam) {
        try {
          const nextUrl = new URL(nextParam, window.location.origin);

          if (nextUrl.origin === window.location.origin) {
            safeNext = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
          }
        } catch {
          safeNext = null;
        }
      }

      router.replace(
        safeNext ?? (data.user?.role === "admin" ? "/admin" : "/")
      );
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8">

        {/* Heading */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-gray-900">
            Shop<span className="text-blue-600">Ease.</span>
          </Link>

          <h1 className="text-2xl font-bold text-gray-900 mt-6">
            Welcome Back!
          </h1>

          <p className="text-gray-500 mt-2">
            Sign in to continue shopping with ShopEase.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600"
          >
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div
            role="status"
            className="mb-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>

            <div className="relative">
              <Mail
                size={19}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>

            <div className="relative">
              <Lock
                size={19}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        {/* Register Link */}
        <p className="text-center text-sm text-gray-500 mt-7">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-blue-600 font-semibold hover:underline"
          >
            Create Account
          </Link>
        </p>

      </div>
    </div>
  );
}
