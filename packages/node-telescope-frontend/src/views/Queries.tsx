import React, { useState, useEffect } from 'react';
import { Table, Tag, Typography } from 'antd';
import { red } from '@ant-design/colors';
import { Entry, RequestsProps } from '../types/GeneralTypes';

import { Link, RouteProps } from 'react-router-dom';
import axios from 'axios';
import { EntryType } from '../types/TelescopeEventTypes';
import useTelescopeEntries from '../hooks/useTelescopeEntries';
import QueryList from '../components/QuryList';

const { Text } = Typography;

const Queries: React.FC<RequestsProps> = ({ socket }) => {
  const { entries, loading, pagination, handlePageChange } = useTelescopeEntries(
    socket,
    EntryType.QUERIES,
  );

  useEffect(() => {
    console.log('Entries updated:', entries);
  }, [entries]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <QueryList queries={entries} />;
};

export default Queries;
