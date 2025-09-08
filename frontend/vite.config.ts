import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isDevelopment = mode === "development";

  const config = {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {},
    },
  };

  if (isDevelopment) {
    const commonProxyConfig = {
      target: env.VITE_TCE_API_BASE_URL,
      changeOrigin: true,
      secure: false,
      cookieDomainRewrite: { "devstudi.com": "localhost" },
    };

    config.server.proxy = {
      "/api": {
        target: env.VITE_API_BASE_URL,
        changeOrigin: true,
        secure: false,
      },
      "/tceplayer-two": commonProxyConfig,
      "/tce-repo-api": commonProxyConfig,
      "/tce-teach-api": commonProxyConfig,
    };
  }

  return config;
});
