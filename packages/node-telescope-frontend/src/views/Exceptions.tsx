import React, { useState, useEffect } from 'react';
import { Table, Tag, Typography } from 'antd';
import { red } from '@ant-design/colors';
import { Entry } from '../types/GeneralTypes';

import { Link } from 'react-router-dom';
import axios from 'axios';

const { Text } = Typography;

const Exceptions: React.FC = () => {
  const [exceptions, setExceptions] = useState<Entry[]>([]);

  useEffect(() => {
    fetchExceptions();
  }, []);

  const fetchExceptions = async () => {
    try {
      const response: any = await axios.get('/telescope/api/entries?type=exceptions');
      console.log('Fetched entries:', response);
      setExceptions(response.data.entries);
    } catch (error) {
      console.error('Failed to fetch entries:', error);
    }
  };

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
      render: (text: string, record: any) => <Link to={`/requests`}>View Details</Link>,
    },
  ];

  return (
    <div>
      <Table
        dataSource={exceptions}
        columns={columns as any}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default Exceptions;
