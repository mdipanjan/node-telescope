import { telescopeMiddleware } from '../../src/middleware/telescope-middleware';
import { Telescope } from '../../src/core/telescope';
import { MockStorage } from '../mocks/mock-storage';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { TelescopeDatabaseType } from '../../src/types';

jest.mock('uuid');
jest.mock('../mocks/mock-storage');
jest.mock('../../src/core/base/telescope-express-setup', () => ({
  setupExpressMiddleware: jest.fn(),
  setupRoutes: jest.fn(),
}));

describe('Telescope Middleware', () => {
  let telescope: Telescope;
  let mockStorage: jest.Mocked<MockStorage>;

  beforeEach(() => {
    mockStorage = new MockStorage() as jest.Mocked<MockStorage>;

    telescope = new Telescope({
      storage: mockStorage,
      watchedEntries: ['REQUESTS'],
      routePrefix: '/telescope',
      databaseType: TelescopeDatabaseType.MONGO,
      app: {} as any,
      server: {} as any,
    });

    (uuidv4 as jest.Mock).mockReturnValue('00000000-0000-0000-0000-000000000000');
  });

  test('logs request', done => {
    const req = {
      method: 'GET',
      url: '/test',
      headers: { 'content-type': 'application/json' },
      ip: '127.0.0.1',
    } as Request;

    const res = {
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          console.log('Response finish event triggered');
          callback();
        }
      }),
      getHeaders: jest.fn().mockReturnValue({}),
      statusCode: 200,
    } as unknown as Response;

    const next = jest.fn();

    console.log('Before middleware call');
    const middleware = telescopeMiddleware(telescope);
    middleware(req, res, next);
    console.log('After middleware call');

    // Simulate response finish event
    //@ts-ignore
    // res.on.mock.calls[0][1]();

    // Use setImmediate instead of process.nextTick
    setImmediate(() => {
      console.log('Inside setImmediate');
      console.log('mockStorage.storeEntry called times:', mockStorage.storeEntry.mock.calls.length);
      expect(mockStorage.storeEntry).toHaveBeenCalledTimes(1);
      expect(mockStorage.storeEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'REQUESTS',
          request: expect.objectContaining({
            method: 'GET',
            url: '/test',
          }),
        }),
      );
      expect(next).toHaveBeenCalled();
      done();
    });
  });
});
