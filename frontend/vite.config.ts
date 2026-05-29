import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    cors: {
      origin: "http://localhost:8001",
    }
  },
  build: {
    manifest: true,
    rolldownOptions: {
      input: "./src/main.tsx",
    },
  }
})
