import express from 'express';
import http from 'http';
import { AddressInfo } from 'net';
import { Telescope } from '../../../src/core/telescope';
// import { TelescopeOptions } from '../../../src/core/telescope-options';
import {
  // setupExpressMiddleware,
  setupRoutes,
} from '../../../src/core/base/telescope-express-setup';

jest.mock('../../../src/utils/logger');

describe('telescope-express-setup', () => {
  let app: express.Express;
  let telescope: Telescope;
  // let options: TelescopeOptions;

  beforeEach(() => {
    app = express();
    telescope = {
      getRoutePrefix: jest.fn().mockReturnValue('/telescope'),
      storage: {
        getEntries: jest.fn(),
        getEntry: jest.fn(),
      },
    } as unknown as Telescope;
    // options = {
    //   corsOptions: {},
    // } as TelescopeOptions;
  });

  // describe('setupExpressMiddleware', () => {
  //   it('should set up CORS and static file serving', () => {
  //     const routePrefix = '/telescope';
  //     setupExpressMiddleware(app, options, routePrefix);

  //     expect(app.use).toHaveBeenCalled();
  //   });
  // });

  describe('setupRoutes', () => {
    let server: http.Server;
    let baseURL: string;

    beforeEach(done => {
      setupRoutes(app, telescope);
      server = app.listen(0, () => {
        const address = server.address() as AddressInfo;
        baseURL = `http://localhost:${address.port}`;
        done();
      });
    });

    afterEach(done => {
      server.close(done);
    });

    const makeRequest = (path: string): Promise<{ statusCode: number; body: string }> => {
      return new Promise((resolve, reject) => {
        http
          .get(`${baseURL}${path}`, res => {
            let data = '';
            res.on('data', chunk => {
              data += chunk;
            });
            res.on('end', () => {
              resolve({ statusCode: res.statusCode || 500, body: data });
            });
          })
          .on('error', reject);
      });
    };

    it('should set up the telescope-config route', async () => {
      const response = await makeRequest('/telescope-config');
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ routePrefix: '/telescope' });
    });

    it('should set up the entries route', async () => {
      (telescope.storage.getEntries as jest.Mock).mockResolvedValue([{ id: '1', data: 'test' }]);
      const response = await makeRequest('/telescope/api/entries');
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual([{ id: '1', data: 'test' }]);
    });

    it('should set up the single entry route', async () => {
      (telescope.storage.getEntry as jest.Mock).mockResolvedValue({ id: '1', data: 'test' });
      const response = await makeRequest('/telescope/api/entries/1');
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ id: '1', data: 'test' });
    });

    it('should handle entry not found', async () => {
      (telescope.storage.getEntry as jest.Mock).mockResolvedValue(null);
      const response = await makeRequest('/telescope/api/entries/999');
      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({ error: 'Entry not found' });
    });

    it('should handle errors when retrieving entries', async () => {
      (telescope.storage.getEntries as jest.Mock).mockRejectedValue(new Error('Database error'));
      const response = await makeRequest('/telescope/api/entries');
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({ error: 'Failed to retrieve entries' });
    });

    it('should handle errors when retrieving a single entry', async () => {
      (telescope.storage.getEntry as jest.Mock).mockRejectedValue(new Error('Database error'));
      const response = await makeRequest('/telescope/api/entries/1');
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({ error: 'Failed to retrieve entry' });
    });
  });
});
