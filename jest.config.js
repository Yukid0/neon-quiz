module.exports = {
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  collectCoverageFrom: [
    'public/js/**/*.js',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  coverageReporters: ['text', 'lcov', 'clover'],
  testMatch: [
    '**/tests/unit/**/*.test.js'
  ],
  moduleFileExtensions: ['js', 'json'],
  transform: {},
  testPathIgnorePatterns: [
    '/node_modules/'
  ]
}; 