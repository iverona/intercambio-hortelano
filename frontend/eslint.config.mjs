import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "src/app/test-exchange-flow/page.tsx",
      "src/app/test-notifications/page.tsx",
      "src/app/test-notifications-complete/page.tsx",
      "src/app/test-notifications-enhanced/page.tsx",
      "src/app/test-reputation-function/page.tsx",
      "src/app/test-review-system/page.tsx",
    ],
  },
];

export default eslintConfig;
