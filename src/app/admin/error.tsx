"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertCircle size={28} />
        </span>

        <h2 className="mt-5 text-xl font-bold text-gray-900">
          The dashboard could not load
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          {error.message || "An unexpected error occurred."}
        </p>

        <button
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <RefreshCw size={17} />
          Try again
        </button>
      </div>
    </div>
  );
}
