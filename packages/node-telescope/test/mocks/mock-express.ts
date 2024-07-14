import { EventEmitter } from 'events';

export class MockRequest {
  public headers: Record<string, string> = {};
  public body: any = {};
  public method: string = 'GET';
  public url: string = '/';
  public ip: string = '127.0.0.1';

  constructor(options?: Partial<MockRequest>) {
    Object.assign(this, options);
  }
}

export class MockResponse extends EventEmitter {
  public statusCode: number = 200;
  private _headers: Record<string, string> = {};
  private _body: any = null;

  status(code: number): this {
    this.statusCode = code;
    return this;
  }

  json(body: any): this {
    this._body = body;
    this.emit('finish');
    return this;
  }

  send(body: any): this {
    this._body = body;
    this.emit('finish');
    return this;
  }

  setHeader(name: string, value: string): this {
    this._headers[name] = value;
    return this;
  }

  getHeader(name: string): string | undefined {
    return this._headers[name];
  }

  getHeaders(): Record<string, string> {
    return { ...this._headers };
  }

  get body(): any {
    return this._body;
  }
}

export function mockNextFunction(): jest.Mock {
  return jest.fn();
}
