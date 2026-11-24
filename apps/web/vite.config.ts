import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { databaseIconsPlugin } from "./vite.database-icons.ts";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(appDir, "../..");
const clientIcons = path.resolve(
  root,
  "data/fixtures/sources/client-br-levelup/icons-all",
);

export default defineConfig({
  plugins: [react(), databaseIconsPlugin(clientIcons)],
  resolve: {
    alias: {
      "@": path.resolve(appDir, "src"),
      "@fixtures": path.resolve(root, "data/fixtures"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 5173,
    fs: {
      allow: [root],
    },
  },
  preview: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 4173,
  },
});
