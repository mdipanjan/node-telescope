export type Entry = {
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
  theme: 'light' | 'dark';
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
