import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(appDir, "../..");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(appDir, "src"),
      "@fixtures": path.resolve(root, "data/fixtures"),
    },
  },
  server: {
    port: 5173,
    fs: {
      allow: [root],
    },
  },
});
