"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";

export default function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleCancel() {
    const confirmed = window.confirm(
      "Cancel this order? This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setPending(true);
    setError("");

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to cancel this order.");
      }

      router.refresh();
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Failed to cancel this order."
      );
      setPending(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleCancel}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <XCircle size={16} />
        )}
        {pending ? "Cancelling..." : "Cancel order"}
      </button>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
