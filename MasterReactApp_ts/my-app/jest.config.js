module.exports = {
  // Allow transforming ESM modules inside these packages (yjs and lib0 use ESM files)
  transformIgnorePatterns: ['node_modules/(?!(yjs|lib0|sucrase|y-protocols|y-websocket)/)'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx|mjs)$': 'babel-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testEnvironment: 'jsdom', // Standard for React apps
};