const nextJest = require("next/jest");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.development" });

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
  dir: ".",
});
const jestConfig = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>/"],
  testTimeout: 60000, // 60 seconds
});

module.exports = jestConfig;
