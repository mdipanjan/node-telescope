import React from 'react';
import { type FallbackProps } from 'react-error-boundary';
import { Button, Col, Result, Row, Space } from 'antd';
import { useRoutePrefix } from '../context/RoutePrefixContext';

export const ErrorFallback: React.FC<FallbackProps> = ({
  error,
  resetErrorBoundary,
}: FallbackProps) => {
  const routePrefix = useRoutePrefix();

  const navigateToHomePage = (): void => {
    window.location.href = routePrefix;
  };

  return (
    <Row justify="center" align="middle" style={{ height: '100vh' }}>
      <Col>
        <Result
          status="error"
          title="There was a problem processing your action."
          subTitle={error.message}
          extra={
            <Space direction="horizontal">
              <Button type="primary" onClick={resetErrorBoundary}>
                Try again
              </Button>
              <Button type="default" onClick={navigateToHomePage}>
                Return to home page
              </Button>
            </Space>
          }
        />
      </Col>
    </Row>
  );
};
