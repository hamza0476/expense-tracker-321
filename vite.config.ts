import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// ✅ Clean version for Capacitor build (no Lovable dependency)
export default defineConfig({
  base: "./", // Important for Android — ensures relative paths for assets
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
