import React, { useState, useEffect } from 'react';
import { Table, Tag, Typography, message } from 'antd';
import { blue } from '@ant-design/colors';
import { timeAgo } from '../utility/time';
import { EventTypes } from '../types/TelescopeEventTypes';
import { Entry, RequestObj, RequestsProps, RequestType, ResponseObj } from '../types/GeneralTypes';
import { getStatusColor } from '../utility/color';
import { Link } from 'react-router-dom';

const { Text } = Typography;

const Requests: React.FC<RequestsProps> = ({ socket }) => {
  const [requests, setRequests] = useState<Entry[]>([]);

  useEffect(() => {
    if (socket) {
      console.log('Setting up socket listeners in Requests component');

      socket.on(EventTypes.INITIAL_ENTRIES, (data: RequestType) => {
        console.log('Received initial entries:', data);
        setRequests(data?.entries);
      });

      socket.on(EventTypes.NEW_ENTRY, (entry: Request) => {
        console.log('Received new entry:', entry);
        setRequests(prevRequests => [entry, ...prevRequests] as any);
      });

      // Request initial entries
      socket.emit('getInitialEntries'); // have to decide on this

      // Error handling
      socket.on('error', (error: any) => {
        console.error('Socket error:', error);
        message.error(`Socket error: ${error.message}`);
      });
    }

    return () => {
      if (socket) {
        console.log('Cleaning up socket listeners');
        socket.off('initialEntries');
        socket.off('newEntry');
        socket.off('error');
      }
    };
  }, [socket]);

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
        <Link to={`/requests/${record.id}`}>View Details</Link>
      ),
    },
  ];

  const loadNewEntries = () => {
    socket.emit('getInitialEntries'); // have to decide on this
  };

  return (
    <div>
      <Table
        dataSource={requests}
        columns={columns as any}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default Requests;
