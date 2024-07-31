import React, { useState } from 'react';
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
  Collapse,
  Space,
  Row,
  Statistic,
  Col,
} from 'antd';
import {
  CopyOutlined,
  ClockCircleOutlined,
  ApiOutlined,
  CodeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DashboardOutlined,
  CloudOutlined,
  CloudDownloadOutlined,
} from '@ant-design/icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useParams } from 'react-router-dom';
import { formatBody } from '../utility/utility';
import { RequestsProps } from '../types/GeneralTypes';
import useEntryDetails from '../hooks/useEntryDetails';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { vs2015 } from 'react-syntax-highlighter/dist/cjs/styles/hljs';

const { Title } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const hasMemoryUsage = (
  entry: any,
): entry is { memoryUsage: { difference: number; before: number; after: number } } => {
  return entry && entry.memoryUsage && typeof entry.memoryUsage.difference === 'number';
};

const RequestDetails: React.FC<RequestsProps> = ({ socket }) => {
  const { id } = useParams<{ id: string }>();
  const { entry, loading, error } = useEntryDetails(socket, id!);
  const [activeKeys, setActiveKeys] = useState<string[]>(['1', '2']);

  if (loading) {
    return <Spin size="large" />;
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" />;
  }

  if (!entry) {
    return <Alert message="Entry not found" type="warning" />;
  }

  const memoryDifference = hasMemoryUsage(entry) ? entry.memoryUsage.difference : 0;
  const memoryIncreased = memoryDifference > 0;

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

  const { timestamp, duration, request, response, curlCommand } = entry as any;

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
                language={request.headers['content-type']?.includes('json') ? 'json' : 'text'}
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
              language={response.headers['content-type']?.includes('json') ? 'json' : 'text'}
            />
          </Card>
        </TabPane>
      </Tabs>
      <Collapse
        activeKey={activeKeys}
        onChange={keys => setActiveKeys(keys as string[])}
        style={{ marginTop: 16 }}
      >
        <Panel
          header={
            <Space>
              <DashboardOutlined />
              <span>Memory Usage</span>
            </Space>
          }
          key="1"
        >
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Before Request"
                value={formatBytes(hasMemoryUsage(entry) ? entry.memoryUsage.before : 0)}
                prefix={<CloudOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="After Request"
                value={formatBytes(hasMemoryUsage(entry) ? entry.memoryUsage.after : 0)}
                prefix={<CloudDownloadOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Difference"
                value={formatBytes(Math.abs(memoryDifference))}
                valueStyle={{ color: memoryIncreased ? '#cf1322' : '#3f8600' }}
                prefix={memoryIncreased ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                suffix={memoryIncreased ? 'Increased' : 'Decreased'}
              />
            </Col>
          </Row>
        </Panel>

        <Panel
          header={
            <Space>
              <CodeOutlined />
              <span>cURL Command</span>
            </Space>
          }
          key="2"
        >
          <div style={{ position: 'relative' }}>
            <Button
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(curlCommand)}
              style={{ position: 'absolute', top: 5, right: 5, zIndex: 1 }}
            >
              Copy
            </Button>
            <SyntaxHighlighter language="bash" style={vs2015}>
              {curlCommand}
            </SyntaxHighlighter>
          </div>
        </Panel>
      </Collapse>
    </div>
  );
};

export default RequestDetails;
