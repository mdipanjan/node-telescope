import { EventEmitter } from 'events';
import { Entry, EntryType } from '../types';
import { Pool } from 'pg';

export interface QueryOptions {
  type?: EntryType;
  page?: number;
  perPage?: number;
  [key: string]: unknown;
}

export interface AdvancedQueryOptions {
  page?: number;
  perPage?: number;
  type?: string | string[] | { type: string };
  requestId?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  sort?: { [key: string]: 1 | -1 };
  [key: string]: any; // for additional filters
}

export interface StorageInterface extends EventEmitter {
  connect(): Promise<void>;
  storeEntry(entry: Omit<Entry, 'id'>): Promise<string>;
  getEntry(id: string): Promise<Entry | null>;
  getEntries(query: QueryOptions): Promise<{ entries: Entry[]; pagination: unknown }>;
  getRecentEntries(limit: number, type?: EntryType): Promise<Entry[]>;
  prune(maxAge: number): Promise<void>;
  getPool?(): Pool | null; // New method
}
