import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/auth";
import { listAdminCustomers } from "@/lib/admin/queries";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  try {
    const customers = await listAdminCustomers();

    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Admin customers GET error:", error);

    return NextResponse.json(
      { error: "Failed to load customers." },
      { status: 500 }
    );
  }
}
