import React, { useState, useEffect } from 'react';
import { Table, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

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

const Requests: React.FC<RequestsProps> = ({ socket, theme }) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (socket) {
      socket.on('initialEntries', (entries: Request[]) => {
        setRequests(entries);
      });

      socket.on('newEntry', (entry: Request) => {
        setRequests(prevRequests => [entry, ...prevRequests]);
      });
    }
  }, [socket]);

  const columns = [
    {
      title: 'Verb',
      dataIndex: 'verb',
      key: 'verb',
      render: (text: string) => (
        <span className={`font-bold ${text === 'GET' ? 'text-green-500' : 'text-blue-500'}`}>
          {text}
        </span>
      ),
    },
    {
      title: 'Path',
      dataIndex: 'path',
      key: 'path',
      filteredValue: [searchText],
      onFilter: (value: string, record: Request) =>
        record.path.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <span
          className={`font-bold ${
            status < 300 ? 'text-green-500' : status < 400 ? 'text-yellow-500' : 'text-red-500'
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => `${duration}ms`,
    },
    {
      title: 'Happened',
      dataIndex: 'happened',
      key: 'happened',
    },
  ];

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
