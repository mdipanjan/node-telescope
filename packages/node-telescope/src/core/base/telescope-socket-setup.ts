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
  logger.info('New socket connection established');
  socket.on(EventTypes.GET_INITIAL_ENTRIES, handleGetInitialEntries);
  socket.on(EventTypes.GET_ENTRY_DETAILS, handleGetEntryDetails);
  storage.on(EventTypes.NEW_ENTRY, handleNewEntry);
  socket.on('disconnect', handleDisconnect);

  async function handleGetInitialEntries(params: {
    type: EntryType;
    page: number;
    perPage: number;
  }) {
    logger.info(`Received request for initial entries:`, params);
    await sendInitialEntries(socket, storage, params);
  }

  async function handleGetEntryDetails({ id }: { id: string }) {
    logger.info(`Received request for entry details:`, id);
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
  }

  function handleNewEntry(entry: unknown) {
    logger.info('New entry detected, emitting to client');
    socket.emit(EventTypes.NEW_ENTRY, entry);
  }

  function handleDisconnect() {
    logger.info('Client disconnected from Telescope');
    socket.removeAllListeners();
  }
}

async function sendInitialEntries(
  socket: Socket,
  storage: StorageInterface,
  params: { type: EntryType; page: number; perPage: number },
): Promise<void> {
  logger.info(`Fetching initial entries with params:`, params);
  try {
    const recentEntries = await storage.getEntries({
      page: params.page,
      perPage: params.perPage,
      sort: { timestamp: -1 },
      type: params.type,
    });
    logger.info(`Sending ${recentEntries.entries.length} initial entries`);
    socket.emit(EventTypes.INITIAL_ENTRIES, recentEntries);
  } catch (error) {
    logger.error('Failed to send initial entries:', error);
    socket.emit('error', { message: 'Failed to fetch initial entries' });
  }
}
