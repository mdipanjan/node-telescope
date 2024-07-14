import { StorageInterface } from '../../src/storage/storage-interface';
import { Entry } from '../../src/types';
import { EventEmitter } from 'events';

export class MockStorage extends EventEmitter implements StorageInterface {
  storeEntry = jest.fn().mockImplementation((entry: Omit<Entry, 'id'>) => {
    console.log('MockStorage.storeEntry called with:', JSON.stringify(entry));
    return Promise.resolve('mock-id');
  });

  getEntry = jest.fn().mockResolvedValue(null);
  getEntries = jest.fn().mockResolvedValue({ entries: [], pagination: {} });
  connect = jest.fn().mockResolvedValue(undefined);
  getRecentEntries = jest.fn().mockResolvedValue([]);
  prune = jest.fn().mockResolvedValue(undefined);
}
