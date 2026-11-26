import Link from "next/link";
import { ArrowLeft, ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
          <ShieldX size={32} />
        </span>

        <h1 className="mt-6 text-2xl font-bold text-gray-900">
          Admin access required
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Your account does not have permission to open the admin dashboard.
          If you believe this is a mistake, ask an existing administrator to
          update your role.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <ArrowLeft size={17} />
            Back to store
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Sign in with another account
          </Link>
        </div>
      </div>
    </div>
  );
}
