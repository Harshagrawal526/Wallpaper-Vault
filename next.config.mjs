const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let remotePatterns = [];

if (supabaseUrl) {
  try {
    const hostname = new URL(supabaseUrl).hostname;
    remotePatterns = [
      {
        protocol: "https",
        hostname,
        pathname: "/storage/v1/object/**"
      },
      {
        protocol: "https",
        hostname,
        pathname: "/storage/v1/render/image/**"
      }
    ];
  } catch {
    remotePatterns = [];
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb"
    }
  },
  images: {
    remotePatterns
  }
};

export default nextConfig;
