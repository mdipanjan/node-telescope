import { Server as SocketServer, Socket } from 'socket.io';
import { StorageInterface } from '../../../src/storage/storage-interface';
import { setupSocketIO } from '../../../src/core/base/telescope-socket-setup';
import { logger } from '../../../src/utils/logger';
import { EntryType, EventTypes } from '../../../src/types';

jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const createMockSocket = () => {
  const socket: Partial<Socket> = {
    on: jest.fn(),
    emit: jest.fn(),
    removeAllListeners: jest.fn(),
  };
  return socket as Socket;
};

const createMockStorage = () => {
  const storage: Partial<StorageInterface> = {
    on: jest.fn(),
    getEntry: jest.fn(),
    getEntries: jest.fn(),
  };
  return storage as StorageInterface;
};

describe('telescope-socket-setup', () => {
  let io: SocketServer;
  let socket: Socket;
  let storage: StorageInterface;

  beforeEach(() => {
    io = new SocketServer();
    socket = createMockSocket();
    storage = createMockStorage();

    jest.spyOn(io, 'on').mockImplementation((event, callback) => {
      if (event === 'connection') {
        callback(socket);
      }

      // TODO: Provide valid return type for 'on' event
      return {} as any;
    });

    setupSocketIO(io, storage);
  });

  it('should set up a connection handler', () => {
    expect(io.on).toHaveBeenCalledWith('connection', expect.any(Function));
  });

  it('should log a new connection', () => {
    expect(logger.info).toHaveBeenCalledWith('New client connected to Telescope');
  });

  it('should set up event listeners for socket events', () => {
    expect(socket.on).toHaveBeenCalledWith(EventTypes.GET_INITIAL_ENTRIES, expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith(EventTypes.GET_ENTRY_DETAILS, expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(storage.on).toHaveBeenCalledWith(EventTypes.NEW_ENTRY, expect.any(Function));
  });

  it('should handle GET_INITIAL_ENTRIES correctly', async () => {
    const params = { type: EntryType.REQUESTS, page: 1, perPage: 10 };
    const mockEntries = {
      entries: [
        {
          id: '2',
          type: EntryType.REQUESTS,
        },
        {
          id: '1',
          type: EntryType.REQUESTS,
        },
      ],
    };
    (storage.getEntries as jest.Mock).mockResolvedValue(mockEntries);

    const handler = (socket.on as jest.Mock).mock.calls.find(
      ([eventName]) => eventName === EventTypes.GET_INITIAL_ENTRIES,
    )[1];

    await handler(params);

    expect(storage.getEntries).toHaveBeenCalledWith({
      page: params.page,
      perPage: params.perPage,
      sort: { timestamp: -1 },
      type: params.type,
    });
    expect(socket.emit).toHaveBeenCalledWith(EventTypes.INITIAL_ENTRIES, mockEntries);
  });

  it('should handle GET_ENTRY_DETAILS correctly when entry exists', async () => {
    const id = '1';
    const mockEntry = { id: '1', data: 'entry details' };
    (storage.getEntry as jest.Mock).mockResolvedValue(mockEntry);

    const handler = (socket.on as jest.Mock).mock.calls.find(
      ([eventName]) => eventName === EventTypes.GET_ENTRY_DETAILS,
    )[1];
    await handler({ id });

    expect(storage.getEntry).toHaveBeenCalledWith(id);
    expect(socket.emit).toHaveBeenCalledWith(EventTypes.ENTRY_DETAILS, mockEntry);
  });

  it('should handle GET_ENTRY_DETAILS with an error when entry does not exist', async () => {
    const id = 'some-random-id';
    (storage.getEntry as jest.Mock).mockResolvedValue(null);

    const handler = (socket.on as jest.Mock).mock.calls.find(
      ([eventName]) => eventName === EventTypes.GET_ENTRY_DETAILS,
    )[1];
    await handler({ id });

    expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Entry not found' });
  });

  it('should handle GET_ENTRY_DETAILS with an error when an exception is thrown', async () => {
    const id = '1';
    const errorMessage = 'Some error';
    (storage.getEntry as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const handler = (socket.on as jest.Mock).mock.calls.find(
      ([eventName]) => eventName === EventTypes.GET_ENTRY_DETAILS,
    )[1];
    await handler({ id });

    expect(logger.error).toHaveBeenCalledWith('Failed to fetch entry details:', expect.any(Error));
    expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Failed to fetch entry details' });
  });

  it('should handle NEW_ENTRY event correctly', () => {
    const mockEntry = {
      id: '2',
      type: EntryType.EXCEPTIONS,
      exception: {
        message: 'string',
        stack: 'string',
        class: 'string',
        file: 'string',
        line: 'number',
        context: { string: 'string' },
      },
    };

    const handler = (storage.on as jest.Mock).mock.calls.find(
      ([eventName]) => eventName === EventTypes.NEW_ENTRY,
    )[1];
    handler(mockEntry);

    expect(socket.emit).toHaveBeenCalledWith(EventTypes.NEW_ENTRY, mockEntry);
  });

  it('should handle disconnect correctly', () => {
    const handler = (socket.on as jest.Mock).mock.calls.find(
      ([eventName]) => eventName === 'disconnect',
    )[1];
    handler();

    expect(logger.info).toHaveBeenCalledWith('Client disconnected from Telescope');
    expect(socket.removeAllListeners).toHaveBeenCalled();
  });

  it('should handle errors in sendInitialEntries correctly', async () => {
    const params = { type: EntryType.VIEWS, page: 1, perPage: 10 };
    const errorMessage = 'Failed to fetch';
    (storage.getEntries as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const handler = (socket.on as jest.Mock).mock.calls.find(
      ([eventName]) => eventName === EventTypes.GET_INITIAL_ENTRIES,
    )[1];
    await handler(params);

    expect(logger.error).toHaveBeenCalledWith('Failed to send initial entries:', expect.any(Error));
    expect(socket.emit).toHaveBeenCalledWith('error', {
      message: 'Failed to fetch initial entries',
    });
  });
});
