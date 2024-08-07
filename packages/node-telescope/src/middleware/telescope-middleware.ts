import { Request, Response, NextFunction } from 'express';
import { Telescope } from '../core/telescope';
import { EntryType, RequestEntry } from '../types';
import { asyncLocalStorage } from '../utils/async-context';
import { v4 as uuidv4 } from 'uuid';
import { generateCurlCommand } from '../utils/utility';

export function telescopeMiddleware(telescope: Telescope) {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log(`Telescope middleware called for ${req.method} ${req.url}`);
    if (req.url.startsWith(telescope.getRoutePrefix())) {
      return next();
    }
    const requestId = uuidv4();
    asyncLocalStorage.run({ requestId }, () => {
      const startTime = Date.now();
      const startMemory = process.memoryUsage().heapUsed;
      const chunks: Buffer[] = [];
      const originalWrite = res.write;
      const originalEnd = res.end;

      res.write = function (
        this: Response,
        chunk: Buffer,
        encodingOrCallback?: BufferEncoding | ((error: Error | null | undefined) => void),
        cb?: (error: Error | null | undefined) => void,
      ): boolean {
        chunks.push(Buffer.from(chunk));
        return originalWrite.call(this, chunk, encodingOrCallback as BufferEncoding, cb);
      };

      res.end = function (
        this: Response,
        chunk?: string | Buffer | Uint8Array,
        encodingOrCallback?: BufferEncoding | ((error: Error | null) => void),
        cb?: () => void,
      ): Response {
        if (chunk) {
          chunks.push(Buffer.from(chunk));
        }
        const responseBody = Buffer.concat(chunks).toString('utf8');
        const responseTime = Date.now() - startTime;
        const endMemory = process.memoryUsage().heapUsed;

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
            requestId: requestId,
          },
          response: {
            statusCode: res.statusCode,
            headers: Object.fromEntries(
              Object.entries(res.getHeaders()).map(([key, value]) => [
                key,
                Array.isArray(value) ? value.join(', ') : value?.toString() || '',
              ]),
            ),
            body: responseBody.substring(0, telescope.options.responseBodySizeLimit || 2000),
          },
          ...(telescope.options.includeCurlCommand && {
            curlCommand: generateCurlCommand(req),
          }),
          ...(telescope.options.recordMemoryUsage && {
            memoryUsage: {
              before: startMemory,
              after: endMemory,
              difference: endMemory - startMemory,
            },
          }),
        };

        if (telescope.options.watchedEntries.includes(EntryType.REQUESTS)) {
          telescope.storage.storeEntry(entry);
        }

        return originalEnd.call(this, chunk, encodingOrCallback as BufferEncoding, cb);
      } as Response['end'];

      next();
    });
  };
}
