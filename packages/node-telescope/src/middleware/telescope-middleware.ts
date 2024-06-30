import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Telescope } from '../core/telescope';
import { Entry } from '../storage/storage-interface';

export function telescopeMiddleware(telescope: Telescope) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const entryId = uuidv4();

    const chunks: Buffer[] = [];
    const originalWrite = res.write;
    const originalEnd = res.end;

    res.write = function (
      this: Response,
      chunk: any,
      encoding?: BufferEncoding | ((error: Error | null) => void),
      cb?: (error: Error | null) => void,
    ): boolean {
      chunks.push(Buffer.from(chunk));
      return originalWrite.apply(this, arguments as any);
    };

    res.end = function (
      this: Response,
      chunk?: any,
      encoding?: BufferEncoding | (() => void),
      cb?: () => void,
    ): Response {
      if (chunk) {
        chunks.push(Buffer.from(chunk));
      }
      const responseBody = Buffer.concat(chunks).toString('utf8');
      const responseTime = Date.now() - startTime;

      const entry: Omit<Entry, 'id'> = {
        type: 'http',
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip || 'unknown',
          headers: Object.fromEntries(
            Object.entries(req.headers).map(([key, value]) => [
              key,
              Array.isArray(value) ? value.join(', ') : value || '',
            ]),
          ),
          body: req.body,
        },
        response: {
          statusCode: res.statusCode,
          headers: Object.fromEntries(
            Object.entries(res.getHeaders()).map(([key, value]) => [
              key,
              Array.isArray(value) ? value.join(', ') : value?.toString() || '',
            ]),
          ),
          body: responseBody.substring(0, 1000), // Limit response body size
        },
        duration: responseTime,
        timestamp: new Date(),
      };

      if (telescope.options.watchedEntries.includes('requests')) {
        telescope.storage.storeEntry(entry);
      }

      return originalEnd.apply(this, arguments as any);
    };

    next();
  };
}
