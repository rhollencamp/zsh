import { defineConfig } from "vite";

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
        silenceDeprecations: [
          "color-functions",
          "global-builtin",
          "if-function",
          "import",
        ],
      },
    },
  },
});
