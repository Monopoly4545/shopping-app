import { pool } from "../lib/db/db";
import { ensureAuthSchema } from "../lib/auth/schema";

async function main() {
  const email = (process.argv[2] ?? process.env.ADMIN_EMAIL ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    console.error("Usage: npm run make-admin -- you@example.com");
    process.exitCode = 1;
    return;
  }

  await ensureAuthSchema();

  const result = await pool.query<{ email: string; role: string }>(
    `UPDATE users
     SET role = 'admin'
     WHERE email = $1
     RETURNING email, role`,
    [email]
  );

  if (result.rowCount === 0) {
    console.error(
      `No account found for ${email}. Create it at /register first, then run this command again.`
    );
    process.exitCode = 1;
    return;
  }

  console.log(`${email} is now an administrator.`);
  console.log("Sign out and sign back in if the dashboard still shows the old role.");
}

main()
  .catch((error) => {
    console.error("Failed to promote admin:", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
