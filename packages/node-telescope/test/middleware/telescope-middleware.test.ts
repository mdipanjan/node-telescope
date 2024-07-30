import { telescopeMiddleware } from '../../src/middleware/telescope-middleware';
import { Telescope } from '../../src/core/telescope';
import { Request, Response } from 'express';
import { EntryType } from '../../src/types';

jest.mock('../../src/utils/async-context', () => ({
  asyncLocalStorage: {
    run: jest.fn((_store, callback) => callback()),
  },
}));

describe('telescopeMiddleware', () => {
  let mockTelescope: jest.Mocked<Telescope>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockTelescope = {
      getRoutePrefix: jest.fn().mockReturnValue('/telescope'),
      options: {
        responseBodySizeLimit: 2000,
        includeCurlCommand: true,
        recordMemoryUsage: true,
        watchedEntries: [EntryType.REQUESTS],
      },
      storage: {
        storeEntry: jest.fn(),
      },
    } as unknown as jest.Mocked<Telescope>;

    mockRequest = {
      method: 'GET',
      url: '/test',
      ip: '127.0.0.1',
      headers: {},
      body: {},
    };

    mockResponse = {
      on: jest.fn(),
      once: jest.fn(),
      removeListener: jest.fn(),
      statusCode: 200,
      getHeaders: jest.fn().mockReturnValue({}),
    };

    nextFunction = jest.fn();
  });

  test('should skip telescope routes', () => {
    mockRequest.url = '/telescope/test';
    const middleware = telescopeMiddleware(mockTelescope);
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
    expect(mockTelescope.storage.storeEntry).not.toHaveBeenCalled();
  });

  // Add more tests here for specific functionality of the middleware
});
