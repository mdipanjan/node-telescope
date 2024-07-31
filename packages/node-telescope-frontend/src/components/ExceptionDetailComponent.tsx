import React from 'react';
import { Card, Descriptions, Typography, Collapse, Tag } from 'antd';
import { ClockCircleOutlined, BugOutlined, FileOutlined } from '@ant-design/icons';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/cjs/languages/hljs/javascript';
import { vs2015 } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import { grey } from '@ant-design/colors';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
SyntaxHighlighter.registerLanguage('javascript', js);

const LineNumber = ({ number, isErrorLine }: { number: number; isErrorLine: boolean }) => (
  <span
    style={{
      display: 'inline-block',
      width: '40px',
      paddingRight: '10px',
      textAlign: 'right',
      color: isErrorLine ? '#ff4d4f' : '#999',
      fontWeight: isErrorLine ? 'bold' : 'normal',
    }}
  >
    {number}
  </span>
);

const CodeEditorStyle: React.FC<{
  code: string;
  errorLine: number;
  startLine: number;
}> = ({ code, errorLine, startLine }) => {
  const lines = code.split('\n');

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '40px',
          backgroundColor: grey[8],
          borderRight: '1px solid #ddd',
        }}
      >
        {lines.map((_, index) => (
          <LineNumber
            key={index}
            number={startLine + index}
            isErrorLine={startLine + index === errorLine}
          />
        ))}
      </div>
      <SyntaxHighlighter
        language="javascript"
        style={vs2015}
        customStyle={{ marginLeft: '40px', padding: '0 10px' }}
        wrapLines={true}
        lineProps={lineNumber => ({
          style: {
            display: 'block',
            backgroundColor:
              startLine + lineNumber - 1 === errorLine ? 'rgba(255, 0, 0, 0.2)' : 'transparent',
          },
        })}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

const ExceptionDetailsComponent: React.FC<{ exception: any }> = ({ exception }) => {
  const renderCodeContext = () => {
    if (!exception?.exception?.context) return null;

    const lineNumbers = Object.keys(exception?.exception?.context).map(Number);
    const startLine = Math.min(...lineNumbers);
    const code = Object.entries(exception?.exception?.context)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([_, line]) => line)
      .join('\n');

    return (
      <CodeEditorStyle code={code} errorLine={exception?.exception?.line} startLine={startLine} />
    );
  };
  return (
    <div>
      <Title level={3}>Exception Details</Title>

      <Card>
        <Descriptions bordered column={{ xxl: 4, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }}>
          <Descriptions.Item label="ID">{exception.id}</Descriptions.Item>
          <Descriptions.Item label="Timestamp">
            <ClockCircleOutlined /> {new Date(exception.timestamp).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Type">
            <BugOutlined /> {exception?.exception?.type}
          </Descriptions.Item>
          <Descriptions.Item label="Class">{exception?.exception?.class}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Title level={4}>Exception Message</Title>
        <Paragraph>
          <Text strong>{exception?.exception?.message}</Text>
        </Paragraph>
        {exception?.exception?.file && (
          <Paragraph>
            <FileOutlined /> {exception.exception.file}
            {exception?.exception?.line && (
              <Tag color="red" style={{ marginLeft: 8 }}>
                Line {exception.line}
              </Tag>
            )}
          </Paragraph>
        )}
      </Card>

      {exception?.exception?.context && (
        <Card style={{ marginTop: 16 }}>
          <Title level={4}>Code Context</Title>
          {renderCodeContext()}
        </Card>
      )}

      <Collapse style={{ marginTop: 16 }}>
        <Panel header="Stack Trace" key="1">
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {exception?.exception?.stack}
          </pre>
        </Panel>
      </Collapse>
    </div>
  );
};

export default ExceptionDetailsComponent;
