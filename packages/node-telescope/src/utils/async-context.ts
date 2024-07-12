import { AsyncLocalStorage } from 'async_hooks';

interface TelescopeContext {
  requestId: string;
}

export const asyncLocalStorage = new AsyncLocalStorage<TelescopeContext>();

export function getRequestId(): string | undefined {
  const store = asyncLocalStorage.getStore();
  return store ? store.requestId : undefined;
}
