import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/auth";
import {
  countAdmins,
  getAdminCustomerRole,
  updateAdminCustomerRole,
} from "@/lib/admin/queries";
import { parseRole } from "@/lib/admin/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const role = parseRole(body?.role);

  if (!role) {
    return NextResponse.json(
      { error: "Role must be either admin or customer." },
      { status: 400 }
    );
  }

  if (id === auth.user.id) {
    return NextResponse.json(
      { error: "You cannot change your own role." },
      { status: 400 }
    );
  }

  try {
    const currentRole = await getAdminCustomerRole(id);

    if (!currentRole) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 }
      );
    }

    if (currentRole === "admin" && role === "customer") {
      const admins = await countAdmins();

      if (admins <= 1) {
        return NextResponse.json(
          { error: "You cannot remove the last admin account." },
          { status: 400 }
        );
      }
    }

    await updateAdminCustomerRole(id, role);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin customers PATCH error:", error);

    return NextResponse.json(
      { error: "Failed to update customer." },
      { status: 500 }
    );
  }
}
