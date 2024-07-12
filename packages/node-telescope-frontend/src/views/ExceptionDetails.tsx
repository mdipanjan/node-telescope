import React from 'react';
import { Alert, Spin } from 'antd';
import { useParams } from 'react-router-dom';
import { RequestsProps } from '../types/GeneralTypes';
import useEntryDetails from '../hooks/useEntryDetails';
import ExceptionDetailComponent from '../components/ExceptionDetailComponent';

const ExceptionDetails: React.FC<RequestsProps> = ({ socket }) => {
  const { id } = useParams<{ id: string }>();
  const { entry: exception, loading, error } = useEntryDetails(socket, id!);

  if (loading) {
    return <Spin size="large" />;
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" />;
  }

  if (!exception) {
    return <Alert message="Exception not found" type="warning" />;
  }

  return <ExceptionDetailComponent exception={exception} />;
};

export default ExceptionDetails;
