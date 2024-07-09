import { useState, useEffect, useCallback } from 'react';
import { EntryType, EventTypes } from '../types/TelescopeEventTypes';
import { Entry } from '../types/GeneralTypes';

const useTelescopeEntries = (socket: any, entryType: EntryType) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const fetchEntries = useCallback(
    (page: number = 1, pageSize: number = 20) => {
      if (socket && socket.connected) {
        console.log(`Requesting ${entryType} entries for page ${page}`);
        socket.emit(EventTypes.GET_INITIAL_ENTRIES, {
          type: entryType,
          page,
          perPage: pageSize,
        });
      } else {
        console.log('Socket not connected, attempting to reconnect');
        socket?.connect();
      }
    },
    [socket, entryType],
  );

  useEffect(() => {
    if (socket) {
      console.log('Setting up socket listeners');

      socket.on(EventTypes.INITIAL_ENTRIES, (data: any) => {
        console.log('Received initial entries:', data);
        setEntries(data.entries || []);
        setPagination({
          current: data.pagination.currentPage,
          pageSize: data.pagination.perPage,
          total: data.pagination.total,
        });
        setLoading(false);
      });

      socket.on(EventTypes.NEW_ENTRY, (entry: Entry) => {
        console.log('Received new entry:', entry);
        if (entry.type === entryType) {
          setEntries(prevEntries => [entry, ...prevEntries]);
          setPagination(prev => ({ ...prev, total: prev.total + 1 }));
        }
      });

      socket.on('connect', () => {
        console.log('Socket connected');
        fetchEntries();
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setLoading(true);
      });

      fetchEntries();
    }

    return () => {
      if (socket) {
        console.log('Cleaning up socket listeners');
        socket.off(EventTypes.INITIAL_ENTRIES);
        socket.off(EventTypes.NEW_ENTRY);
        socket.off('connect');
        socket.off('disconnect');
      }
    };
  }, [socket, entryType, fetchEntries]);

  const handlePageChange = (page: number, pageSize?: number) => {
    fetchEntries(page, pageSize);
  };

  return { entries, loading, pagination, handlePageChange };
};

export default useTelescopeEntries;
