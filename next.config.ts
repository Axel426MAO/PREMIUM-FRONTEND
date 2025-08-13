import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desativa o indicador de build no canto superior direito
  devIndicators: {
    buildActivity: false,
  },

  // Caso queira ignorar ESLint/TypeScript temporariamente (opcional)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
