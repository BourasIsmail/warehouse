import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["images.unsplash.com", "source.unsplash.com", "localhost"],
  },
  async rewrites() {
    return [
      {
        source: "/api/orion/:path*",
        destination: "http://localhost:1026/:path*",
      },
      {
        source: "/api/wirecloud/:path*",
        destination: "http://localhost:8000/:path*",
      },
      {
        source: "/api/keyrock/:path*",
        destination: "http://localhost:3005/:path*",
      },
    ]
  },
}

export default nextConfig

