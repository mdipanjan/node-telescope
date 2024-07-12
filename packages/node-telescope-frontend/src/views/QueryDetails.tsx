import React from 'react';
import { useParams } from 'react-router-dom';
import { Spin, Alert } from 'antd';
import useEntryDetails from '../hooks/useEntryDetails';
import QueryDetailsComponent from '../components/QueryDetailsComponent';

const QueryDetails: React.FC<{ socket: any }> = ({ socket }) => {
  const { id } = useParams<{ id: string }>();
  const { entry: query, loading, error } = useEntryDetails(socket, id!);

  if (loading) {
    return <Spin size="large" />;
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" />;
  }

  if (!query) {
    return <Alert message="Query not found" type="warning" />;
  }

  return <QueryDetailsComponent query={query} />;
};

export default QueryDetails;
