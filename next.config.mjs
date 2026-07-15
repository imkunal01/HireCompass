/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "googleapis", "nodemailer"],
  },
};

export default nextConfig;
