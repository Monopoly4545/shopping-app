export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-4 w-24 rounded bg-gray-200" />
        <div className="h-8 w-72 max-w-full rounded bg-gray-200" />
        <div className="h-4 w-96 max-w-full rounded bg-gray-100" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 rounded-2xl border border-gray-200 bg-white"
          />
        ))}
      </div>

      <div className="h-80 rounded-2xl border border-gray-200 bg-white" />
    </div>
  );
}
