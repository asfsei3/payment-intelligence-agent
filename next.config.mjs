/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produce a minimal self-contained server bundle for container deployments.
  // Required for the Dockerfile in this repo (Azure Container Apps target).
  output: "standalone",
};

export default nextConfig;
