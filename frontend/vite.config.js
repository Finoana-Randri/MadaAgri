import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The Python server (server.py) owns the API and the product photos.
const backend = "http://127.0.0.1:8765";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: { "/api": backend, "/assets": backend },
  },
  build: {
    outDir: "dist",
    assetsDir: "static",
    emptyOutDir: true,
  },
});
