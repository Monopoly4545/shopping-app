
import Link from "next/link";
import {
  Search,
  ShoppingBag,
  ArrowLeft,
  Home,
} from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4 py-16">
      <div className="max-w-xl w-full text-center">

        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
            <ShoppingBag
              size={44}
              className="text-blue-600"
            />
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-8xl sm:text-9xl font-extrabold text-blue-600 tracking-tight">
          404
        </h1>

        {/* Message */}
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-4">
          Oops! Page Not Found
        </h2>

        <p className="text-gray-500 mt-4 leading-7">
          Looks like this page has gone shopping!
          The page you are looking for doesn't exist
          or may have been moved.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            <Home size={18} />
            Back to Home
          </Link>

          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition"
          >
            <Search size={18} />
            Explore Products
          </Link>

        </div>

        {/* Additional Message */}
        <p className="text-sm text-gray-400 mt-10">
          Need help?{" "}
          <Link
            href="/contact"
            className="text-blue-600 hover:underline"
          >
            Contact our support team
          </Link>
        </p>

        <div className="mt-12 text-sm text-gray-400">
          Error Code: 404
        </div>

      </div>
    </main>
  );
}