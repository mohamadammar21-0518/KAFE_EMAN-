import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  if (command === "build" && !env.VITE_CONVEX_URL?.trim()) {
    throw new Error(
      "VITE_CONVEX_URL is missing. Set it in your hosting provider's BUILD environment variables, then rebuild. Vite embeds this URL in the frontend bundle. Setting a runtime variable after building does not update it.",
    );
  }
  return {
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  };
});
