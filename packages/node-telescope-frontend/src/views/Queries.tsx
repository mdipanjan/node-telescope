import React, { useEffect } from 'react';
import { RequestsProps } from '../types/GeneralTypes';

import { EntryType } from '../types/TelescopeEventTypes';
import useTelescopeEntries from '../hooks/useTelescopeEntries';
import QueryList from '../components/QuryList';

const Queries: React.FC<RequestsProps> = ({ socket }) => {
  const { entries, loading } = useTelescopeEntries(socket, EntryType.QUERIES);

  useEffect(() => {
    console.log('Entries updated:', entries);
  }, [entries]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <QueryList queries={entries} />;
};

export default Queries;
