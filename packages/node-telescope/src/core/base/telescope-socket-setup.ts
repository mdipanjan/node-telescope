import { Server as SocketServer, Socket } from 'socket.io';
import { StorageInterface } from '../../storage/storage-interface';
import { logger } from '../../utils/logger';
import { EntryType, EventTypes } from '../../types';

export function setupSocketIO(io: SocketServer, storage: StorageInterface): void {
  io.on('connection', (socket: Socket) => {
    logger.info('New client connected to Telescope');
    handleSocketConnection(socket, storage);
  });
}

async function handleSocketConnection(socket: Socket, storage: StorageInterface): Promise<void> {
  console.log('New socket connection established');

  socket.on(
    EventTypes.GET_INITIAL_ENTRIES,
    (params: { type: EntryType; page: number; perPage: number }) => {
      console.log(`Received request for initial entries:`, params);
      sendInitialEntries(socket, storage, params);
    },
  );

  storage.on(EventTypes.NEW_ENTRY, (entry: unknown) => {
    console.log('New entry detected, emitting to client');
    socket.emit(EventTypes.NEW_ENTRY, entry);
  });

  socket.on(EventTypes.GET_ENTRY_DETAILS, async ({ id }: { id: string }) => {
    try {
      const entry = await storage.getEntry(id);
      if (entry) {
        socket.emit(EventTypes.ENTRY_DETAILS, entry);
      } else {
        socket.emit('error', { message: 'Entry not found' });
      }
    } catch (error) {
      logger.error('Failed to fetch entry details:', error);
      socket.emit('error', { message: 'Failed to fetch entry details' });
    }
  });
}

async function sendInitialEntries(
  socket: Socket,
  storage: StorageInterface,
  params: { type: EntryType; page: number; perPage: number },
): Promise<void> {
  console.log(`Fetching initial entries with params:`, params);
  try {
    const recentEntries = await storage.getEntries({
      page: params.page,
      perPage: params.perPage,
      sort: { timestamp: -1 },
      type: params.type,
    });
    console.log(`Sending ${recentEntries.entries.length} initial entries`);
    socket.emit(EventTypes.INITIAL_ENTRIES, recentEntries);
  } catch (error) {
    console.error('Failed to send initial entries:', error);
    socket.emit('error', { message: 'Failed to fetch initial entries' });
  }
}
