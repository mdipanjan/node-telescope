import { EventEmitter } from 'events';

export class MockSocket extends EventEmitter {
  public id: string;
  public handshake: { headers: Record<string, string> };

  constructor(id = 'mock-socket-id') {
    super();
    this.id = id;
    this.handshake = { headers: {} };
  }

  join(room: string): void {
    // Mock implementation
  }

  leave(room: string): void {
    // Mock implementation
  }

  emit(event: string, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }
}

export class MockSocketIO extends EventEmitter {
  public sockets: Map<string, MockSocket> = new Map();

  emit(event: string, ...args: any[]): boolean {
    this.sockets.forEach(socket => socket.emit(event, ...args));
    return true;
  }

  to(room: string): this {
    // Mock implementation for room-specific emits
    return this;
  }

  in(room: string): this {
    // Alias for 'to'
    return this.to(room);
  }
}
