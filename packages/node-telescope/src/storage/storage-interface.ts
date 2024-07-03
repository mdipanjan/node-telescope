import { EventEmitter } from 'events';
import { Entry, EntryType } from '../types';

export interface QueryOptions {
  type?: EntryType;
  page?: number;
  perPage?: number;
  [key: string]: unknown;
}

export interface StorageInterface extends EventEmitter {
  connect(): Promise<void>;
  storeEntry(entry: Omit<Entry, 'id'>): Promise<string>;
  getEntry(id: string): Promise<Entry | null>;
  getEntries(query: QueryOptions): Promise<{ entries: Entry[]; pagination: unknown }>;
  getRecentEntries(limit: number, type?: EntryType): Promise<Entry[]>;
  prune(maxAge: number): Promise<void>;
}
