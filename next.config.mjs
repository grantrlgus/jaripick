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
};

export default nextConfig;
