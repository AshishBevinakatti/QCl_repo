import { defineConfig } from "vitest/config"; // vite config + the `test` section
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true }, // the Keycloak client only allows this origin in dev
  test: { environment: "jsdom" },
});
