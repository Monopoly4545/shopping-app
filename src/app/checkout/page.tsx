import { getCurrentUser } from "@/lib/auth/session";
import CheckoutForm from "@/components/checkout/CheckoutForm";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await getCurrentUser();

  return (
    <CheckoutForm
      user={
        user
          ? {
              email: user.email,
              fullName: user.fullName,
            }
          : null
      }
    />
  );
}
