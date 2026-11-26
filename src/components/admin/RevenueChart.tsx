import type { RevenuePoint } from "@/types/admin";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export default function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const max = Math.max(...data.map((point) => point.revenue), 1);
  const total = data.reduce((sum, point) => sum + point.revenue, 0);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">Revenue</h2>
          <p className="text-xs text-gray-500">Last {data.length} days</p>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(total)}
          </p>
          <p className="text-xs text-gray-500">excluding cancelled orders</p>
        </div>
      </div>

      <div className="mt-8 flex h-56 items-end gap-1.5 sm:gap-2">
        {data.map((point) => {
          const height = point.revenue === 0 ? 3 : Math.max((point.revenue / max) * 100, 6);

          return (
            <div
              key={point.date}
              className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
              title={`${formatDay(point.date)}: ${formatCurrency(point.revenue)} · ${point.orders} orders`}
            >
              <div className="relative flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-blue-500/80 transition group-hover:bg-blue-600"
                  style={{ height: `${height}%` }}
                />
              </div>

              <span className="hidden truncate text-[10px] text-gray-400 sm:block">
                {formatDay(point.date)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
        <span>{formatDay(data[0]?.date ?? "")}</span>
        <span>{formatDay(data[data.length - 1]?.date ?? "")}</span>
      </div>
    </section>
  );
}
