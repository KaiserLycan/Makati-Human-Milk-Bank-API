import globals from "globals";
import pluginJs from "@eslint/js";
import pluginJest from "eslint-plugin-jest";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
    {
        ignores: ["lib/db/generated/prisma/**"],
    },
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.node,
                ...globals.jest,
            },
        },
    },
    pluginJs.configs.recommended,
    {
        files: ["__test__/**/*.js", "**/*.test.js", "**/*.spec.js"],
        ...pluginJest.configs["flat/recommended"],
    },
    {
        files: ["__test__/**/*.js", "**/*.test.js", "**/*.spec.js"],
        rules: {
            "jest/expect-expect": [
                "error",
                {
                    assertFunctionNames: ["expect", "request.**.expect"],
                },
            ],
        },
    },
    {
        rules: {
            complexity: ["warn", 20],
            "no-unused-vars": "warn",
            "no-undef": "warn",
        },
    },
    eslintConfigPrettier,
];
