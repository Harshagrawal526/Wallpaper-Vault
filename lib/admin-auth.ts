import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env";

const COOKIE_NAME = "vault_admin_session";

function sign(payload: string): string {
  return createHmac("sha256", env.adminSessionSecret).update(payload).digest("base64url");
}

function createToken(): string {
  const payload = `admin:${Math.floor(Date.now() / 1000)}`;
  const signature = sign(payload);
  return Buffer.from(`${payload}.${signature}`, "utf8").toString("base64url");
}

function verifyToken(token: string): boolean {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const parts = raw.split(".");
    if (parts.length !== 2) {
      return false;
    }
    const [payload, signature] = parts;
    if (!payload.startsWith("admin:")) {
      return false;
    }

    const expected = sign(payload);
    const left = Buffer.from(signature);
    const right = Buffer.from(expected);
    if (left.length !== right.length) {
      return false;
    }

    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return false;
  }
  return verifyToken(token);
}

export async function setAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
