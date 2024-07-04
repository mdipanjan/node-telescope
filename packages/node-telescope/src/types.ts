export enum EntryType {
  REQUESTS = 'requests',
  EXCEPTIONS = 'exceptions',
  LOGS = 'logs',
  EVENTS = 'events',
  QUERIES = 'queries',
  VIEWS = 'views',
}

export interface BaseEntry {
  id?: string;
  type: EntryType;
  timestamp: Date;
}

export interface RequestEntry extends BaseEntry {
  type: EntryType.REQUESTS;
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

export interface ExceptionEntry extends BaseEntry {
  type: EntryType.EXCEPTIONS;
  exception: {
    message: string;
    stack?: string;
    class?: string;
  };
}
export interface LogEntry extends BaseEntry {
  type: EntryType.LOGS;
  // Add log-specific fields
}

export interface EventEntry extends BaseEntry {
  type: EntryType.EVENTS;
  // Add event-specific fields
}

export interface ViewEntry extends BaseEntry {
  type: EntryType.VIEWS;
  // Add view-specific fields
}

export interface QueryEntry extends BaseEntry {
  type: EntryType.QUERIES;
  data: {
    method: string;
    query: string;
    collection: string;
    duration: number;
    result?: string;
  };
}

export type Entry = RequestEntry | ExceptionEntry | QueryEntry | LogEntry | EventEntry | ViewEntry;
