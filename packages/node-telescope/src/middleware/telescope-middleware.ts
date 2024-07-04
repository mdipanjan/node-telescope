import { Request, Response, NextFunction } from 'express';
import { Telescope } from '../core/telescope';
import { EntryType, RequestEntry } from '../types';

export function telescopeMiddleware(telescope: Telescope) {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log(`Telescope middleware called for ${req.method} ${req.url}`);

    const startTime = Date.now();

    const chunks: Buffer[] = [];
    const originalWrite = res.write;
    const originalEnd = res.end;

    res.write = function (
      this: Response,
      chunk: any,
      //@ts-ignore
      encodingOrCallback?: BufferEncoding | ((error: Error | null) => void),
      //@ts-ignore
      cb?: (error: Error | null) => void,
    ): boolean {
      chunks.push(Buffer.from(chunk));
      return originalWrite.apply(this, arguments as any);
    };

    res.end = function (
      this: Response,
      chunk?: any,
      //@ts-ignore
      encodingOrCallback?: BufferEncoding | ((error: Error | null) => void),
      //@ts-ignore
      cb?: () => void,
    ): Response {
      if (chunk) {
        chunks.push(Buffer.from(chunk));
      }
      const responseBody = Buffer.concat(chunks).toString('utf8');
      const responseTime = Date.now() - startTime;

      const entry: Omit<RequestEntry, 'id'> = {
        type: EntryType.REQUESTS,
        timestamp: new Date(),
        duration: responseTime,
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
      };

      if (telescope.options.watchedEntries.includes(EntryType.REQUESTS)) {
        telescope.storage.storeEntry(entry);
      }

      return originalEnd.apply(this, arguments as any);
    };

    next();
  };
}
