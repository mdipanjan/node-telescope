import React from 'react';
import { Card, Descriptions, Typography, Tag, Alert, Button } from 'antd';
import { ClockCircleOutlined, DatabaseOutlined, EyeOutlined } from '@ant-design/icons';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useNavigate } from 'react-router-dom';

SyntaxHighlighter.registerLanguage('json', json);

const { Title } = Typography;

const QueryDetailsComponent: React.FC<{ query: any }> = ({ query }) => {
  const safeJsonParse = (jsonString: string) => {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      // If parsing fails, return the original string
      return jsonString;
    }
  };

  const renderJsonHighlight = (jsonString: string) => {
    const parsedJson = safeJsonParse(jsonString);
    const displayJson =
      typeof parsedJson === 'object' ? JSON.stringify(parsedJson, null, 2) : parsedJson;

    return (
      <>
        <SyntaxHighlighter language="json" style={vs2015}>
          {displayJson}
        </SyntaxHighlighter>
        {typeof parsedJson !== 'object' && (
          <Alert
            message="Incomplete Data"
            description="The data appears to be truncated or incomplete."
            type="warning"
            showIcon
          />
        )}
      </>
    );
  };

  return (
    <div>
      <Title level={3}>Query Details</Title>

      <Card>
        <Descriptions bordered column={{ xxl: 4, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }}>
          <Descriptions.Item label="ID">{query.id}</Descriptions.Item>
          <Descriptions.Item label="Timestamp">
            <ClockCircleOutlined /> {new Date(query.timestamp).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Type">
            <DatabaseOutlined /> {query.type}
          </Descriptions.Item>
          <Descriptions.Item label="Collection">{query.data.collection}</Descriptions.Item>
          <Descriptions.Item label="Method">
            <Tag color="blue">{query.data.method}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Request">
            {/* {query.data.requestId} */}
            <Button
              icon={<EyeOutlined />}
              onClick={() => {
                // Method should be findby requestid
                // navigate(`/requests/${query?.data?.requestId}`);
              }}
            >
              Request details
            </Button>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Title level={4}>Query</Title>
        {renderJsonHighlight(query.data.query)}
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Title level={4}>Result</Title>
        {renderJsonHighlight(query.data.result)}
      </Card>
    </div>
  );
};

export default QueryDetailsComponent;
