/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "k.kakaocdn.net",
      },
    ],
  },
  async rewrites() {
    return [
      { source: "/ops-9f3k", destination: "/admin/index.html" },
      { source: "/resident", destination: "/resident/index.html" },
    ];
  },
};

export default nextConfig;
