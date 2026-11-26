export default function LoadingScreen({
  message = "Loading...",
  className = "min-h-screen",
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 bg-gray-50 px-6 ${className}`}
    >
      <div
        role="status"
        aria-live="polite"
        className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"
      >
        <span className="sr-only">{message}</span>
      </div>

      <p className="text-sm font-medium text-gray-500">{message}</p>
    </div>
  );
}
