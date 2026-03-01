import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function requireAdminUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user?.email || user.email.toLowerCase() !== env.adminEmail.toLowerCase()) {
    redirect("/admin/login?error=unauthorized");
  }

  return user;
}
