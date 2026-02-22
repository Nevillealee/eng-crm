import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests", "<rootDir>/test"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.js"],
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
};

export default createJestConfig(customJestConfig);
