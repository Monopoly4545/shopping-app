This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Admin Dashboard

The admin area lives at `/admin` and includes:

- `/admin` — overview and recent activity
- `/admin/products` — create, edit and delete products
- `/admin/orders` — view orders and update fulfillment status
- `/admin/customers` — view accounts, spending and change roles
- `/admin/analytics` — revenue, best sellers and order pipeline

### Create your first administrator

New registrations are always created with the `customer` role. Register an
account normally, then promote it from the terminal:

```bash
npm run make-admin -- you@example.com
```

Refresh the page (or sign out and back in) and open
[http://localhost:3000/admin](http://localhost:3000/admin).

### Optional demo orders

The dashboard starts empty until orders exist. To fill the Orders and
Analytics pages with sample data:

```bash
npm run seed:orders
```

This creates demo customers (password: `password123`) and 14 demo orders. It
skips itself if any orders already exist.

### How access control works

- Authentication uses the existing HTTP-only `session` cookie backed by the
  `sessions` table.
- `users.role` is `admin` or `customer`; it is checked on the server for every
  admin page and every `/api/admin/*` request.
- `src/proxy.ts` only performs the optimistic "is there a session cookie?"
  redirect to `/login?next=...`. It is not the authorization boundary.
- `src/app/admin/layout.tsx` and each admin page call `requireAdminPage()`,
  which redirects unauthenticated users to login and non-admins to
  `/unauthorized`.
- Admin API route handlers call `requireAdminApi()` and return `401` or `403`
  before touching data.
- Admins cannot change their own role, and the last remaining admin cannot be
  demoted.
- `users.role`, `orders` and `order_items` are created automatically on first
  use. Existing users are migrated to the `customer` role.

## Checkout, orders and payments

The storefront now has a complete Cash on Delivery checkout flow:

- `/cart` → `/checkout` collects the delivery address and payment method.
- `POST /api/orders` re-reads the cart from Postgres (or validates guest
  items), calculates prices and shipping on the server, then creates the order,
  order items, payment and shipping records in one transaction.
- Product names, images and prices are snapshotted on `order_items`, so later
  product edits never change a customer's history.
- Signed-in customers see `/orders` and `/orders/[id]`. Guests can reopen their
  order at `/orders/lookup` with the order number and the email used at
  checkout; a secret, HTTP-only access cookie is issued only after both match.
- Admin order management is at `/admin/orders`. Admins can change the order
  status, verify/update the payment status, and see items, delivery address,
  payment transaction and tracking details.

### Payment methods

Cash on Delivery (`cod`) works out of the box. Stripe, PayPal and KBZPay are
listed in the checkout UI but disabled until a provider integration is added.
Card numbers and CVV codes are never sent to or stored by this app; online
providers must use their hosted checkout page.

### Payment webhook

`POST /api/webhooks` accepts signed provider callbacks. Set
`PAYMENT_WEBHOOK_SECRET` in `.env.local`, then send:

```json
{
  "provider": "stripe",
  "transactionId": "pi_example_123",
  "orderNumber": "SE-100001",
  "amount": 42.5,
  "status": "paid"
}
```

The `x-payment-signature` header must be the hex HMAC-SHA256 of the raw request
body using that secret. The handler verifies the signature and amount, updates
the payment and order idempotently, and confirms a pending order when payment
succeeds.

### Status model

- Payment: `pending`, `paid`, `failed`, `refunded`
- Order: `pending`, `confirmed`, `processing`, `shipped`, `delivered`,
  `cancelled`
- Shipping: `pending`, `preparing`, `shipped`, `delivered`, `cancelled`

Cash on Delivery orders become `paid` automatically when an admin marks them
delivered. Online payments become `paid` through the signed webhook.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.