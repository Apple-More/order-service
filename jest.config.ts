import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'], // Look for test files in a 'tests' folder with '.test.ts' suffix
  moduleFileExtensions: ['ts', 'js'],
  reporters: [
    'default',
    ['jest-ctrf-json-reporter', {}],
  ],
};

export default config;