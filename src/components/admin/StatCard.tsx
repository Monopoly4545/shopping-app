import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "blue" | "green" | "amber" | "violet";
};

const tones = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
};

export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "blue",
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            {value}
          </p>
          {hint && <p className="mt-2 text-xs text-gray-500">{hint}</p>}
        </div>

        <span className={`rounded-xl p-3 ${tones[tone]}`}>
          <Icon size={22} />
        </span>
      </div>
    </div>
  );
}
