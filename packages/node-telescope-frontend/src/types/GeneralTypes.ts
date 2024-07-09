import { EntryType } from './TelescopeEventTypes';

export type Entry = {
  type: EntryType;
  id: string;
  verb: string;
  path: string;
  status: number;
  duration: number;
  happened: string;
};
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
