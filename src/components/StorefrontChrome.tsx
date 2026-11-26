"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Hides storefront-only chrome (Navbar/Footer) on admin routes.
 * Storefront pages render exactly as before.
 */
export default function StorefrontChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return <>{children}</>;
}
