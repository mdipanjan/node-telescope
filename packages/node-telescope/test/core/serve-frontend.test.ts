import { Express } from 'express';
import fs from 'fs';
import path from 'path';
import { serveFrontend } from '../../src/core/serve-frontend';
import { logger } from '../../src/utils/logger';

jest.mock('fs');
jest.mock('path');
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
  },
}));

describe('serveFrontend', () => {
  let app: Express;
  const mockRoutePrefix = '/telescope';
  const mockFrontendPath = '/mocked/frontend/path';

  beforeEach(() => {
    app = {
      use: jest.fn(),
      get: jest.fn(),
    } as unknown as Express;
    (path.resolve as jest.Mock).mockReturnValue(mockFrontendPath);
    (fs.existsSync as jest.Mock).mockReturnValue(true);
  });

  it('should attempt to serve frontend when files are found', () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    serveFrontend(app, mockRoutePrefix);

    expect(path.resolve).toHaveBeenCalledWith(expect.any(String), '../../frontend');
    expect(fs.existsSync).toHaveBeenCalledWith(mockFrontendPath);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining(
        `[serveFrontend] Attempting to serve frontend from: ${mockFrontendPath}`,
      ),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining(`[serveFrontend] Route prefix: ${mockRoutePrefix}`),
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Frontend directory exists. Setting up routes.'),
    );
    expect(app.use).toHaveBeenCalledWith(mockRoutePrefix, expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/site.webmanifest', expect.any(Function));
    expect(app.get).toHaveBeenCalledWith(`${mockRoutePrefix}/*`, expect.any(Function));
  });

  it('should handle frontend not found', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    serveFrontend(app, mockRoutePrefix);

    expect(fs.existsSync).toHaveBeenCalledWith(mockFrontendPath);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Frontend build not found. Dashboard will not be available.'),
    );
    expect(app.use).not.toHaveBeenCalled();
    expect(app.get).not.toHaveBeenCalled();
  });
});
