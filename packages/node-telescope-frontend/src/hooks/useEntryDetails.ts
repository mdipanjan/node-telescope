import { useState, useEffect, useCallback } from 'react';
import { Entry } from '../types/GeneralTypes';
import { EventTypes } from '../types/TelescopeEventTypes';
import { fetchEntry } from '../services/api';

const useEntryDetails = (socket: any, id: string) => {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntryDetails = useCallback(async () => {
    if (socket && socket.connected) {
      setLoading(true);
      setError(null);
      console.log(`Requesting details for entry ${id}`);
      socket.emit(EventTypes.GET_ENTRY_DETAILS, { id });
    } else {
      console.log(`Fetching details for entry ${id} via HTTP`);
      try {
        const response = await fetchEntry(id);
        setEntry(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch entry details:', err);
        setError('Failed to fetch entry details. Please try again.');
        setLoading(false);
      }
    }
  }, [socket, id]);

  useEffect(() => {
    if (socket) {
      socket.on(EventTypes.ENTRY_DETAILS, (data: Entry) => {
        console.log('Received entry details:', data);
        setEntry(data);
        setLoading(false);
      });

      socket.on('error', (error: any) => {
        console.error('Socket error:', error);
        setError(error.message || 'An error occurred');
        setLoading(false);
      });

      fetchEntryDetails();
    }

    return () => {
      if (socket) {
        socket.off(EventTypes.ENTRY_DETAILS);
        socket.off('error');
      }
    };
  }, [socket, fetchEntryDetails]);

  return { entry, loading, error, refetch: fetchEntryDetails };
};

export default useEntryDetails;
