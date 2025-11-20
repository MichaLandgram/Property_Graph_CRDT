module.exports = {
  // Allow transforming ESM modules inside these packages (yjs and lib0 use ESM files) - I hate this XD
  transformIgnorePatterns: ['node_modules/(?!(yjs|lib0|sucrase)/)'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx|mjs)$': 'babel-jest',
  },
  // Setup file to polyfill `crypto` in the test environment when needed
  setupFiles: ['<rootDir>/jest.setup.js'],
};