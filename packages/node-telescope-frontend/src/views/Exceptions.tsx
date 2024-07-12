import React, { useEffect } from 'react';
import { Button, Table, Tag, Typography } from 'antd';
import { red } from '@ant-design/colors';
import { RequestsProps } from '../types/GeneralTypes';

import { useNavigate } from 'react-router-dom';
import { EntryType } from '../types/TelescopeEventTypes';
import useTelescopeEntries from '../hooks/useTelescopeEntries';
import { EyeOutlined } from '@ant-design/icons';

const { Text } = Typography;

const Exceptions: React.FC<RequestsProps> = ({ socket }) => {
  const { entries, loading, pagination, handlePageChange } = useTelescopeEntries(
    socket,
    EntryType.EXCEPTIONS,
  );
  const navigate = useNavigate();

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
        <Button
          icon={<EyeOutlined />}
          onClick={() => {
            navigate(`/exceptions/${record.id}`);
          }}
        >
          View Details
        </Button>
        // <Link to={`/exceptions/${record?.id}`}>View Details</Link>
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
