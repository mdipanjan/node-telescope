import { EventEmitter } from 'events';

export interface Entry {
  id: string;
  type: string;
  timestamp: Date;
  duration: number;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: any;
    ip: string;
  };
  response: {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
  };
}

export interface QueryOptions {
  page?: number;
  perPage?: number;
  [key: string]: unknown;
}

export interface StorageInterface extends EventEmitter {
  connect(): Promise<void>;
  storeEntry(entry: Omit<Entry, 'id'>): Promise<string>;
  getEntry(id: string): Promise<Entry | null>;
  getEntries(query: QueryOptions): Promise<{ entries: Entry[]; pagination: unknown }>;
  getRecentEntries(limit: number): Promise<Entry[]>;
  prune(maxAge: number): Promise<void>;
}
