import globals from "globals";
import pluginJs from "@eslint/js";
import pluginJest from "eslint-plugin-jest";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
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
            complexity: ["warn", 10],
            "no-unused-vars": "warn",
            "no-undef": "warn",
        },
    },
    eslintConfigPrettier,
];
