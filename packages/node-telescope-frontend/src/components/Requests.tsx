import React, { useState, useEffect } from 'react';
import { Table, Input, Tag, Typography, Button, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { blue, green } from '@ant-design/colors';
import { timeAgo } from '../utility/time';
import { getStatusColor } from '../utility/color';

interface Request {
  id: string;
  verb: string;
  path: string;
  status: number;
  duration: number;
  happened: string;
}

interface RequestsProps {
  socket: any;
  theme: 'light' | 'dark';
}
type RequestObj = {
  ip: string;
  method: string;
  url: string;
};
type ResponseObj = {
  body: string;
  statusCode: number;
  headers: Record<string, string>;
};
const { Text } = Typography;

const Requests: React.FC<RequestsProps> = ({ socket, theme }) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (socket) {
      console.log('Setting up socket listeners in Requests component');

      socket.on('initialEntries', (entries: Request[]) => {
        console.log('Received initial entries:', entries);
        setRequests(entries);
      });

      socket.on('newEntry', (entry: Request) => {
        console.log('Received new entry:', entry);
        setRequests(prevRequests => [entry, ...prevRequests]);
      });

      // Request initial entries
      socket.emit('getInitialEntries');

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
          style={{ width: 50, textAlign: 'center' }}
        >
          {obj?.method}
        </Tag>
      ),
    },
    {
      title: 'Path',
      dataIndex: 'request',
      key: 'path',
      render: (obj: RequestObj) => (
        <Text style={{ color: theme === 'dark' ? '#fff' : '#000' }}>{obj?.url}</Text>
      ),
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
  ];

  const loadNewEntries = () => {
    socket.emit('getInitialEntries');
  };

  return (
    <div>
      {/* <Input
          placeholder="Search Path"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ marginBottom: 16 }}
        /> */}
      <Table
        dataSource={requests}
        columns={columns as any}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        className={theme === 'dark' ? 'ant-table-dark' : ''}
      />
    </div>
  );
};

export default Requests;
