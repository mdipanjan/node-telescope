import React, { useState, useEffect } from 'react';
import { Table, Tag, Typography } from 'antd';
import { red } from '@ant-design/colors';
import { Entry, RequestsProps } from '../types/GeneralTypes';

import { Link, RouteProps } from 'react-router-dom';
import axios from 'axios';
import { EntryType } from '../types/TelescopeEventTypes';
import useTelescopeEntries from '../hooks/useTelescopeEntries';

const { Text } = Typography;

const Exceptions: React.FC<RequestsProps> = ({ socket }) => {
  const { entries, loading, pagination, handlePageChange } = useTelescopeEntries(
    socket,
    EntryType.EXCEPTIONS,
  );

  useEffect(() => {
    console.log('Entries updated:', entries);
  }, [entries]);

  const columns = [
    {
      title: 'Verb',
      dataIndex: 'exception',
      key: 'verb',
      render: (obj: any) => (
        <Tag
          style={{
            width: 50,
            textAlign: 'center',
            color: red[5],
          }}
        >
          {obj?.class}
        </Tag>
      ),
    },
    {
      title: 'Message',
      dataIndex: 'exception',
      key: 'message',
      render: (obj: any) => <Text>{obj?.message}</Text>,
    },
    {
      title: 'Action',
      key: 'action',
      render: (text: string, record: any) => (
        <Link to={`/exceptions/${record?.id}`}>View Details</Link>
      ),
    },
  ];

  return (
    <div>
      <Table
        dataSource={entries}
        columns={columns as any}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default Exceptions;
