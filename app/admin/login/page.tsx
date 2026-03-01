import Link from "next/link";

import { loginAdmin } from "@/app/actions";
import { SubmitButton } from "@/app/ui-submit-button";

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto mt-5 mb-10 w-[94vw] max-w-2xl text-textMain">
      <Link className="mb-2 inline-block text-sm font-semibold text-accent hover:underline" href="/">
        Back to gallery
      </Link>
      <h1 className="mb-4 text-3xl font-semibold">Admin Login</h1>
      {params.error ? <p className="mb-3 text-sm text-red-300">Invalid credentials or unauthorized user.</p> : null}

      <form className="max-w-md rounded-2xl border border-white/10 bg-[#070c18c2] p-4" action={loginAdmin}>
        <div className="mb-4">
          <label htmlFor="email" className="mb-1 block text-sm">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-xl border border-white/20 bg-[#0a1221c7] px-3 py-2 text-textMain outline-none"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="mb-1 block text-sm">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-xl border border-white/20 bg-[#0a1221c7] px-3 py-2 text-textMain outline-none"
          />
        </div>
        <SubmitButton
          idleText="Login"
          pendingText="Logging in..."
          className="rounded-xl bg-accent px-4 py-2 font-semibold text-[#081522] disabled:cursor-not-allowed disabled:opacity-70"
        />
      </form>
    </main>
  );
}
