import { EntryType } from './TelescopeEventTypes';
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
    requestId?: string;
  };
  response: {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
  };
  curlCommand?: string;
  memoryUsage?: {
    before: number;
    after: number;
    difference: number;
  };
}
export interface ExceptionEntry extends BaseEntry {
  type: EntryType.EXCEPTIONS;
  exception: {
    message: string;
    stack?: string;
    class?: string;
    file?: string;
    line?: number;
    context?: { [key: string]: string };
  };
}

export interface QueryEntry extends BaseEntry {
  type: EntryType.QUERIES;
  data: {
    method: string;
    query: string;
    collection: string;
    duration: number;
    result?: string;
    requestId?: string;
  };
}

export type Entry = RequestEntry | ExceptionEntry | QueryEntry;

export interface RequestType {
  entries: Entry[];
  pagination: {
    total: number;
  };
}

export interface RequestsProps {
  socket: any;
}
export type RequestObj = {
  ip: string;
  method: string;
  url: string;
};
export type ResponseObj = {
  body: string;
  statusCode: number;
  headers: Record<string, string>;
};
