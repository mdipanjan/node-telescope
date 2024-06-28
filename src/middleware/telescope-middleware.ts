import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Telescope } from '../core/telescope';

export function telescopeMiddleware(telescope: Telescope) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const entryId = uuidv4();

    const chunks: Buffer[] = [];
    const originalWrite = res.write;
    const originalEnd = res.end;

    res.write = function (
      chunk: any,
      encoding?: BufferEncoding | ((error: Error) => void),
      cb?: (error: Error) => void,
    ): boolean {
      chunks.push(Buffer.from(chunk));
      return originalWrite.apply(this, arguments as any);
    } as Response['write'];

    res.end = function (
      chunk?: any,
      encoding?: BufferEncoding | (() => void),
      cb?: () => void,
    ): Response {
      if (chunk) {
        chunks.push(Buffer.from(chunk));
      }
      const responseBody = Buffer.concat(chunks).toString('utf8');
      const responseTime = Date.now() - startTime;

      const entry = {
        id: entryId,
        type: 'http',
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          headers: req.headers,
          body: req.body,
        },
        response: {
          statusCode: res.statusCode,
          headers: res.getHeaders(),
          body: responseBody.substring(0, 1000), // Limit response body size
        },
        duration: responseTime,
        timestamp: new Date(),
      };

      if (telescope.options.watchedEntries.includes('requests')) {
        telescope.storage.storeEntry(entry as any);
      }

      return originalEnd.apply(this, arguments as any);
    } as Response['end'];

    next();
  };
}
