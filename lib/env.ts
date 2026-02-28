function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  bucketName: process.env.SUPABASE_STORAGE_BUCKET ?? "wallpapers",
  bucketPublic: (process.env.SUPABASE_BUCKET_PUBLIC ?? "true") === "true",
  signedUrlExpirySeconds: Number(process.env.SUPABASE_SIGNED_URL_EXPIRES_IN ?? "3600"),
  adminEmail: requireEnv("ADMIN_EMAIL"),
  adminPassword: requireEnv("ADMIN_PASSWORD"),
  adminSessionSecret: requireEnv("ADMIN_SESSION_SECRET")
};
