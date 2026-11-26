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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.