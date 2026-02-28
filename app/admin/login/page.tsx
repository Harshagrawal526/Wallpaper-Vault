import Link from "next/link";

import { loginAdmin } from "@/app/actions";

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="detail-wrap">
      <Link className="back-link" href="/">
        Back to gallery
      </Link>
      <h1>Admin Login</h1>
      {params.error ? <p className="error">Invalid credentials.</p> : null}

      <form className="card-like" action={loginAdmin}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
        <br />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required />
        <br />
        <button className="button" type="submit">
          Login
        </button>
      </form>
    </main>
  );
}
