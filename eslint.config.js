import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default [
  js.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      globals: {
        console: true,
        window: true,
        document: true,
      },
    },
  },
];
