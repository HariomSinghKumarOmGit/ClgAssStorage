"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export default function RequestAccessPage() {
  const { data: session } = useSession();
  const [submitted, setSubmitted] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      signIn("google");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error ?? "Something went wrong");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Request submitted!</h2>
          <p className="text-sm text-gray-500">
            Your access request has been sent to the admin. You&apos;ll be able
            to upload once it&apos;s approved. Check back in your dashboard.
          </p>
          <a
            href="/"
            className="mt-6 inline-block text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            ← Back to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-sm w-full">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Request Upload Access</h1>
        <p className="text-sm text-gray-500 mb-6">
          Tell us a bit about yourself. The admin will review your request
          before granting upload privileges.
        </p>

        {!session ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              First, sign in with Google so we know who you are.
            </p>
            <Button
              variant="secondary"
              size="lg"
              className="w-full justify-center gap-3"
              onClick={() => signIn("google")}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
              ✓ Signed in as <strong>{session.user.name}</strong> ({session.user.email})
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Why do you want to upload? (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. I'm a 3rd year CSE student at XYZ college and want to share my assignments..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
              Submit Request
            </Button>

            <p className="text-xs text-gray-400 text-center">
              Your Google identity is used to verify you&apos;re a real person and to track abuse.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
