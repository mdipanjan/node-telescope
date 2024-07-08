import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Typography, message } from 'antd';
import { blue } from '@ant-design/colors';
import { timeAgo } from '../utility/time';
import { EventTypes } from '../types/TelescopeEventTypes';
import { Entry, RequestObj, RequestsProps, RequestType, ResponseObj } from '../types/GeneralTypes';
import { getStatusColor } from '../utility/color';
import { Link, useLocation } from 'react-router-dom';

const { Text } = Typography;

const Requests: React.FC<RequestsProps> = ({ socket }) => {
  const [requests, setRequests] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const fetchInitialEntries = useCallback(() => {
    if (socket && socket.connected) {
      setLoading(true);
      console.log('Requesting initial entries');
      socket.emit('getInitialEntries');
    } else {
      console.log('Socket not connected, attempting to reconnect');
      socket?.connect();
    }
  }, [socket]);

  useEffect(() => {
    if (socket) {
      console.log('Setting up socket listeners in Requests component');

      socket.on('connect', () => {
        console.log('Socket connected, fetching initial entries');
        fetchInitialEntries();
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setLoading(true);
      });

      socket.on(EventTypes.INITIAL_ENTRIES, (data: { entries: Entry[] }) => {
        console.log('Received initial entries:', data);
        setRequests(data.entries || []);
        setLoading(false);
      });

      socket.on(EventTypes.NEW_ENTRY, (entry: Entry) => {
        console.log('Received new entry:', entry);
        setRequests(prevRequests => [entry, ...prevRequests]);
      });

      socket.on('error', (error: any) => {
        console.error('Socket error:', error);
        message.error(`Socket error: ${error.message}`);
        setLoading(false);
      });

      // Initial fetch
      fetchInitialEntries();
    }

    return () => {
      if (socket) {
        console.log('Cleaning up socket listeners');
        socket.off('connect');
        socket.off('disconnect');
        socket.off(EventTypes.INITIAL_ENTRIES);
        socket.off(EventTypes.NEW_ENTRY);
        socket.off('error');
      }
    };
  }, [socket, fetchInitialEntries]);

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
