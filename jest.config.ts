import { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  coverageDirectory: "./coverage",
  collectCoverageFrom: [
    "**/src/**/*.ts",
    "!**/node_modules/**",
    "!**/(types|symbols).ts",
  ],
  coverageReporters: ["text", "lcov"],
  collectCoverage: true,
  testMatch: ["**/src/**/?(*.)+(spec|test|e2e).[jt]s?(x)", "**/e2e/**/?(*.)+(spec|test|e2e).[jt]s?(x)"],
  testPathIgnorePatterns: ["/mock/", "/node_modules/", "/lib/"],
};

export default config;
