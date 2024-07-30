const nodeCrypto = require('crypto');

Object.defineProperty(global, 'crypto', {
  value: {
    randomBytes: nodeCrypto.randomBytes,
  },
});

jest.mock('mongoose', () => ({
  createConnection: jest.fn(() => ({
    model: jest.fn(),
    on: jest.fn(),
  })),
  Schema: jest.fn(),
}));

jest.mock('node:async_hooks', () => ({
  AsyncLocalStorage: class MockAsyncLocalStorage {
    run(store, callback) {
      return callback();
    }
    getStore() {
      return {};
    }
  },
}));

jest.mock('uuid');

jest.mock('node:crypto', () => ({
  randomBytes: size => Buffer.alloc(size).fill(1),
}));
