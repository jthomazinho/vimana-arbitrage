module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    "airbnb-base",
    "plugin:jest/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    sourceType: "module"
  },
  plugins: [
    "import",
    "@typescript-eslint",
    "jest",
  ],
  "settings": {
    "import/extensions": [".js", ".ts"],
    "import/parsers": {
      "@typescript-eslint/parser": [".ts"]
    },
    "import/resolver": {
      "typescript": {
        "directory": "./tsconfig.json"
      },
      "node": {
        "extensions": [".js", ".ts"]
      }
    }
  },
  ignorePatterns: [
    "build/**",
    "jest.*",
    "moleculer.config.ts",
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars-experimental": "error",
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        "js": "never",
        "ts": "never",
      }
    ],
    "import/no-extraneous-dependencies": [
      "error",
      {
        "devDependencies": [
          "typings/**",
          "spec/**",
          "*.spec.ts",
          "jest.setup.ts",
        ],
      },
    ],
    "max-len": ["error", { "code": 120 }],
    "prefer-destructuring": "off",
  },
  overrides: [
    {
      files: ["**/*.js"],
      rules: {
        "@typescript-eslint/explicit-function-return-type": "off",
      }
    },
    {
      files: ["db/migrate/*.js", "db/seed/*.js"],
      rules: {
        "@typescript-eslint/camelcase": "off",
      }
    }
  ],
};
