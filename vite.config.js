export default {
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
};
