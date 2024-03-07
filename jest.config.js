// XXX: default NODE_ENV "test" and "unittest" is conflict with online test server
process.env.NODE_ENV = 'jest';

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/test/fixtures'],
  coveragePathIgnorePatterns: ['<rootDir>/test/'],
};
