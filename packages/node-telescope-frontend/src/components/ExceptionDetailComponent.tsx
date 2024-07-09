import React from 'react';
import { Card, Descriptions, Typography, Collapse } from 'antd';
import { ClockCircleOutlined, BugOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const ExceptionDetails: React.FC<{ exception: any }> = ({ exception }) => {
  return (
    <div>
      <Title level={3}>Exception Details</Title>

      <Card>
        <Descriptions bordered column={{ xxl: 4, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }}>
          <Descriptions.Item label="Timestamp">
            <ClockCircleOutlined /> {new Date(exception.timestamp).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Type">
            <BugOutlined /> {exception.type}
          </Descriptions.Item>
          <Descriptions.Item label="Class">{exception.exception.class}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Title level={4}>Exception Message</Title>
        <Text>{exception.exception.message}</Text>
      </Card>

      <Collapse style={{ marginTop: 16 }}>
        <Panel header="Stack Trace" key="1">
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {exception.exception.stack}
          </pre>
        </Panel>
      </Collapse>
    </div>
  );
};

export default ExceptionDetails;
