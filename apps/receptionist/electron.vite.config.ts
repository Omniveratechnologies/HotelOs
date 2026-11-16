import { resolve } from "node:path";
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  main: {
    build: {
      lib: {
        entry: resolve(__dirname, "electron/main/index.ts"),
      },
    },
  },
  preload: {
    build: {
      lib: {
        entry: resolve(__dirname, "electron/preload/index.ts"),
      },
    },
  },
  renderer: {
    root: ".",
    build: {
      rollupOptions: {
        input: resolve(__dirname, "index.html"),
      },
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
  },
});
