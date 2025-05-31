// backend/.eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser for TypeScript
  extends: [
    'eslint:recommended', // Uses the recommended rules from ESLint
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from @typescript-eslint/eslint-plugin
    'prettier', // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with Prettier
    'plugin:prettier/recommended', // Enables eslint-plugin-prettier and displays Prettier errors as ESLint errors. **Make sure this is always the last configuration in the extends array.**
  ],
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
  },
  env: {
    node: true, // Enable Node.js global variables and Node.js scoping.
    es2021: true, // Add global variables for ES2021 (you can adjust the year as needed).
  },
  rules: {
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs.
    // Examples:
    // "@typescript-eslint/explicit-function-return-type": "warn",
    // "@typescript-eslint/no-explicit-any": "warn",
    // "no-console": "warn", // Example: warn about console.log statements
  },
};
