// Jest setup file: provide a `crypto` implementation for environments
// where `globalThis.crypto` is not available (lib0/webcrypto expects it).
try {
  if (typeof globalThis.crypto === 'undefined') {
    // Prefer Node's built-in WebCrypto (Node >= 16.0)
    const nodeCrypto = require('crypto');
    if (nodeCrypto && nodeCrypto.webcrypto) {
      globalThis.crypto = nodeCrypto.webcrypto;
    } else {
      // Minimal fallback: provide getRandomValues using crypto.randomFillSync
      const { randomFillSync } = require('crypto');
      globalThis.crypto = {
        getRandomValues: (arr) => {
          if (!(arr && arr.byteLength !== undefined)) {
            throw new TypeError('Expected an ArrayBufferView');
          }
          // Ensure Uint8Array view
          const u8 = arr instanceof Uint8Array ? arr : new Uint8Array(arr.buffer || arr);
          randomFillSync(u8);
          return arr;
        },
      };
    }
  }
} catch (e) {
  // If something goes wrong, leave tests to fail with original error to aid debugging
  // but print a helpful message to aid diagnostics.
  // eslint-disable-next-line no-console
  console.warn('jest.setup.js: could not polyfill global.crypto:', e && e.message);
}
