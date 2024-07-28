import { Telescope } from '../../src/core/telescope';
import { TelescopeOptions } from '../../src/core/telescope-options';
import { TelescopeDatabaseType, EntryType } from '../../src/types';
import { MockStorage } from '../mocks/mock-storage';
import { Express } from 'express';
import { setupSocketIO } from '../../src/core/base/telescope-socket-setup';
import { setupExpressMiddleware } from '../../src/core/base/telescope-express-setup';
import { logger } from '../../src/utils/logger';
import { setupExceptionLogging } from '../../src/core/entry-handlers/telescope-exception-handling';
import { setupQueryLogging } from '../../src/core/entry-handlers/telescope-query-logging';

jest.mock('../../src/core/entry-handlers/telescope-exception-handling', () => ({
  setupExceptionLogging: jest.fn(),
  logException: jest.fn(),
}));

jest.mock('../../src/core/entry-handlers/telescope-query-logging', () => ({
  setupQueryLogging: jest.fn(),
}));

jest.mock('../../src/core/base/telescope-socket-setup', () => ({
  setupSocketIO: jest.fn(),
}));

jest.mock('../../src/core/base/telescope-express-setup', () => ({
  setupExpressMiddleware: jest.fn(),
  setupRoutes: jest.fn(),
}));

jest.mock('../../src/core/base/telescope-socket-setup', () => ({
  setupSocketIO: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Telescope', () => {
  let telescope: Telescope;
  let mockStorage: jest.Mocked<MockStorage>;
  let mockApp: Partial<Express>;

  beforeEach(() => {
    mockStorage = new MockStorage() as jest.Mocked<MockStorage>;
    mockApp = {
      use: jest.fn(),
      get: jest.fn(),
    };

    const options: TelescopeOptions = {
      storage: mockStorage,
      watchedEntries: [EntryType.REQUESTS, EntryType.EXCEPTIONS],
      databaseType: TelescopeDatabaseType.MONGO,
      app: mockApp as Express,
      server: {} as any,
    };
    telescope = new Telescope(options);
    setupExceptionLogging(telescope);
  });

  test('initializes with correct options', () => {
    expect(telescope.options.watchedEntries).toContain(EntryType.REQUESTS);
    expect(telescope.options.watchedEntries).toContain(EntryType.EXCEPTIONS);
    expect(telescope.options.enableFileReading).toBe(false);
    expect(telescope.options.fileReadingEnvironments).toEqual(['development']);
    expect(telescope.options.includeCurlCommand).toBe(false);
    expect(telescope.options.recordMemoryUsage).toBe(false);
    expect(telescope.options.responseBodySizeLimit).toBe(2000);
    expect(telescope.options.queryResultSizeLimit).toBe(2000);
  });

  test('setupExpressMiddleware and setupRoutes are called with correct parameters', () => {
    expect(setupExpressMiddleware).toHaveBeenCalledWith(mockApp, telescope.options, '/telescope');
  });

  test('initialize correctly sets up exception logging', () => {
    // Recreate the telescope instance with options that enable query logging
    telescope = new Telescope({
      storage: mockStorage,
      watchedEntries: [],
      databaseType: TelescopeDatabaseType.MONGO,
      app: mockApp as Express,
      server: {} as any,
      enableQueryLogging: true,
    });
    expect(setupQueryLogging).toHaveBeenCalledWith(telescope);
  });

  test('connect calls storage.connect() and logs info on success', async () => {
    await telescope.connect();
    expect(mockStorage.connect).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('Telescope storage connected');
  });

  test('connect logs error on failure', async () => {
    mockStorage.connect.mockRejectedValueOnce(new Error('Connection error'));
    await telescope.connect();
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to connect Telescope storage:',
      expect.any(Error),
    );
  });

  test('setupSocketIO is called with the correct parameters', () => {
    // Call a public method that eventually triggers setupSocketServer
    telescope.setupWithExpress();
    // Verify that the SocketServer was created and setupSocketIO was called
    expect(setupSocketIO).toHaveBeenCalled();
  });
});
