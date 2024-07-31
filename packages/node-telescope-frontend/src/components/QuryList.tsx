import React, { useState } from 'react';
import { Table, Tag, Space, Button, Drawer, Typography, Descriptions } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';

import { useNavigate } from 'react-router-dom';
import { useRoutePrefix } from '../context/RoutePrefixContext';
import json from 'react-syntax-highlighter/dist/cjs/languages/hljs/json';
import vs2015 from 'react-syntax-highlighter/dist/cjs/styles/hljs/vs2015';

SyntaxHighlighter.registerLanguage('json', json);

const { Title } = Typography;

const QueryList: React.FC<{
  queries: any[];
  pagination: { current: number; pageSize: number; total: number };
  handlePageChange: (page: number, pageSize: number) => void;
}> = ({ queries, pagination, handlePageChange }) => {
  const [selectedQuery] = useState<any | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const navigate = useNavigate();
  const routePrefix = useRoutePrefix();

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: 'Collection',
      dataIndex: ['data', 'collection'],
      key: 'collection',
    },
    {
      title: 'Method',
      dataIndex: ['data', 'method'],
      key: 'method',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Request ID',
      dataIndex: ['data', 'requestId'],
      key: 'requestId',
      ellipsis: true,
    },
    {
      title: 'Action',
      key: 'action',
      render: (text: string, record: any) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => {
            navigate(`${routePrefix}/queries/${record.id}`);
          }}
        >
          View Details
        </Button>
      ),
    },
  ];

  const renderJsonHighlight = (jsonString: string) => (
    <SyntaxHighlighter language="json" style={vs2015}>
      {JSON.stringify(JSON.parse(jsonString), null, 2)}
    </SyntaxHighlighter>
  );

  return (
    <div>
      <Title level={2}>Query List</Title>
      <Table
        columns={columns}
        dataSource={queries}
        rowKey="id"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: handlePageChange,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
        }}
      />

      <Drawer
        title="Query Details"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        visible={drawerVisible}
        width={600}
      >
        {selectedQuery && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="ID">{selectedQuery.id}</Descriptions.Item>
              <Descriptions.Item label="Timestamp">
                {new Date(selectedQuery.timestamp).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Collection">
                {selectedQuery.data.collection}
              </Descriptions.Item>
              <Descriptions.Item label="Method">
                <Tag color="blue">{selectedQuery.data.method}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Request ID">
                {selectedQuery.data.requestId}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <Title level={4}>Query</Title>
              {renderJsonHighlight(selectedQuery.data.query)}
            </div>

            <div>
              <Title level={4}>Result</Title>
              {renderJsonHighlight(selectedQuery.data.result)}
            </div>
          </Space>
        )}
      </Drawer>
    </div>
  );
};

export default QueryList;
