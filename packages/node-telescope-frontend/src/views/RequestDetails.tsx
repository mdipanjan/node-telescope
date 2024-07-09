import React, { useEffect, useState } from 'react';
import {
  Typography,
  Card,
  Tag,
  Tabs,
  Button,
  Descriptions,
  Table,
  message,
  Alert,
  Spin,
} from 'antd';
import { CopyOutlined, ClockCircleOutlined, ApiOutlined, CodeOutlined } from '@ant-design/icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { formatBody } from '../utility/utility';
import { RequestsProps } from '../types/GeneralTypes';
import useEntryDetails from '../hooks/useEntryDetails';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const RequestDetails: React.FC<RequestsProps> = ({ socket }) => {
  const { id } = useParams<{ id: string }>();
  const { entry, loading, error, refetch } = useEntryDetails(socket, id!);

  if (loading) {
    return <Spin size="large" />;
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" />;
  }

  if (!entry) {
    return <Alert message="Entry not found" type="warning" />;
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('copied to clipboard');
  };

  const CodeBlock = ({ code, language }: { code: string; language: string }) => (
    <div style={{ position: 'relative' }}>
      <Button
        icon={<CopyOutlined />}
        onClick={() => copyToClipboard(code)}
        style={{ position: 'absolute', top: 5, right: 5, zIndex: 1 }}
      />
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{ maxHeight: '400px', overflowY: 'auto' }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );

  const { timestamp, duration, request, response } = entry as any;

  const headerColumns = [
    { title: 'Header', dataIndex: 'header', key: 'header' },
    { title: 'Value', dataIndex: 'value', key: 'value', width: '70%' },
  ];

  const requestHeaders = Object.entries(request.headers).map(([header, value]) => ({
    key: header,
    header,
    value: Array.isArray(value) ? value.join(', ') : value,
  }));

  const responseHeaders = Object.entries(response.headers).map(([header, value]) => ({
    key: header,
    header,
    value: Array.isArray(value) ? value.join(', ') : value,
  }));

  return (
    <div>
      <Title level={3}>Request Details</Title>

      <Card>
        <Descriptions bordered column={3}>
          <Descriptions.Item label="Timestamp">
            <ClockCircleOutlined /> {new Date(timestamp).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Duration">
            <Tag color="blue">{duration}ms</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Method">
            <Tag color="green">{request.method}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="URL">{request.url}</Descriptions.Item>
          <Descriptions.Item label="IP Address">{request.ip}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Tabs defaultActiveKey="request" style={{ marginTop: 20 }}>
        <TabPane tab="Request" key="request">
          <Card
            title={
              <Title level={4}>
                <ApiOutlined /> Headers
              </Title>
            }
          >
            <Table
              columns={headerColumns}
              dataSource={requestHeaders}
              pagination={false}
              size="small"
            />
          </Card>
          {request.body && request.headers && (
            <Card title={<Title level={4}>Request Body</Title>} style={{ marginTop: 16 }}>
              <CodeBlock
                code={formatBody(request.body)}
                language={
                  request.headers && request.headers['content-type']?.includes('json')
                    ? 'json'
                    : 'text'
                }
              />
            </Card>
          )}
        </TabPane>
        <TabPane tab="Response" key="response">
          <Card>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Status Code">
                <Tag color={response.statusCode < 400 ? 'green' : 'red'}>{response.statusCode}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
          <Card
            title={
              <Title level={4}>
                <CodeOutlined /> Headers
              </Title>
            }
            style={{ marginTop: 16 }}
          >
            <Table
              columns={headerColumns}
              dataSource={responseHeaders}
              pagination={false}
              size="small"
            />
          </Card>
          <Card title={<Title level={4}>Response Body</Title>} style={{ marginTop: 16 }}>
            <CodeBlock
              code={formatBody(response.body)}
              language={
                response.headers && response.headers['content-type']?.includes('json')
                  ? 'json'
                  : 'text'
              }
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default RequestDetails;
