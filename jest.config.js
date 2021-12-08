require('dotenv').config();

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: "src/.*\.test\.ts",
  collectCoverage: true
};
