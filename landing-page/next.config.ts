import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Development through a public HTTPS tunnel: the landing page is served at "/" of one shared ngrok
  // origin (staff ERP at /erp/, Keycloak at /realms, API at /api; ERP_DEV/infra/proxy/Caddyfile, D-124).
  // Next dev blocks dev assets requested from another hostname unless it is listed here. Extra hostnames
  // can be added with DEV_PUBLIC_HOSTS (comma-separated, hostnames only).
  allowedDevOrigins: [
    "*.ngrok-free.dev",
    ...(process.env.DEV_PUBLIC_HOSTS?.split(",").map((h) => h.trim()).filter(Boolean) ?? []),
  ],
};

export default nextConfig;
