/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jdlnwaiiegdmpqbzuztu.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // jsPDF uses 'canvas' at runtime in Node — keep it external so the
      // server bundle doesn't try to resolve it and crash on import.
      config.externals.push("canvas");
    }
    return config;
  },
};

module.exports = nextConfig;
