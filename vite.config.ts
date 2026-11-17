import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Served from the root of app.manhattanreasoning.com (see public/CNAME).
// Routing is hash-based, so GitHub Pages needs no rewrite rules.
export default defineConfig({
  plugins: [react()],
  base: "/",
});
