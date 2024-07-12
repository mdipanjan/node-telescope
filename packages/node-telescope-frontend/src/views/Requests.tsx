import React, { useState, useEffect, useCallback } from 'react';
import { Button, Table, Tag, Typography, message } from 'antd';
import { blue } from '@ant-design/colors';
import { timeAgo } from '../utility/time';
import { EntryType, EventTypes } from '../types/TelescopeEventTypes';
import { Entry, RequestObj, RequestsProps, RequestType, ResponseObj } from '../types/GeneralTypes';
import { getStatusColor } from '../utility/color';
import { Link, useNavigate } from 'react-router-dom';
import useTelescopeEntries from '../hooks/useTelescopeEntries';
import { EyeOutlined } from '@ant-design/icons';

const { Text } = Typography;

const Requests: React.FC<RequestsProps> = ({ socket }) => {
  const { entries } = useTelescopeEntries(socket, EntryType.REQUESTS);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Entries updated:', entries);
  }, [entries]);

  const columns = [
    {
      title: 'Verb',
      dataIndex: 'request',
      key: 'verb',
      render: (obj: RequestObj) => (
        <Tag
          color={obj?.method === 'GET' ? blue[4] : 'blue'}
          style={{
            width: 50,
            textAlign: 'center',
          }}
        >
          {obj?.method}
        </Tag>
      ),
    },
    {
      title: 'Path',
      dataIndex: 'request',
      key: 'path',
      render: (obj: RequestObj) => <Text>{obj?.url}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'response',
      key: 'status',
      render: (status: ResponseObj) => (
        <Tag color={getStatusColor(status?.statusCode)}>{status?.statusCode}</Tag>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => <Text>{duration}ms</Text>,
    },
    {
      title: 'Happened',
      dataIndex: 'timestamp',
      key: 'happened',
      render: (time: string) => <Text type="secondary">{timeAgo(time)}</Text>,
    },
    {
      title: 'Action',
      key: 'action',
      render: (text: string, record: any) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => {
            navigate(`/requests/${record.id}`);
          }}
        >
          View Details
        </Button>
      ),
    },
  ];

  const loadNewEntries = () => {
    // socket.emit('getInitialEntries'); // have to decide on this
  };

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

export default Requests;
