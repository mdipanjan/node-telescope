import { AsyncLocalStorage } from 'async_hooks';
import { Request } from 'express';

interface TelescopeContext {
  requestId: string;
}

export const asyncLocalStorage = new AsyncLocalStorage<TelescopeContext>();

export function getRequestId(): string | undefined {
  const store = asyncLocalStorage.getStore();
  return store ? store.requestId : undefined;
}

export function generateCurlCommand(req: Request): string {
  let curlCommand = `curl -X ${req.method} `;

  // Add headers
  Object.entries(req.headers).forEach(([key, value]) => {
    if (key !== 'host' && key !== 'connection') {
      // Exclude some headers
      curlCommand += `-H '${key}: ${value}' `;
    }
  });

  // Add body for POST, PUT, PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    curlCommand += `-d '${JSON.stringify(req.body)}' `;
  }

  // Add URL
  curlCommand += `'${req.protocol}://${req.get('host')}${req.originalUrl}'`;

  return curlCommand;
}
