import { useEffect, useState } from 'react';
import { Flex, Layout, Menu, message, theme } from 'antd';
import { DatabaseOutlined, CodeOutlined, ClockCircleOutlined } from '@ant-design/icons';
import ThemeToggle from '../components/ThemeToggle';
import Requests from '../views/Requests';
import { io } from 'socket.io-client';
import { useTheme } from '../context/ThemeContext';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import RequestDetails from '../views/RequestDetails';
import Exceptions from '../views/Exceptions';
import ExceptionDetails from '../views/ExceptionDetails';
import Queries from '../views/Queries';
import QueryDetails from '../views/QueryDetails';

const LayoutComponent = () => {
  const { Sider, Content, Header, Footer } = Layout;
  const { isDarkMode } = useTheme();
  const { token } = theme.useToken();

  const [selectedMenu, setSelectedMenu] = useState('/requests');
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:4000', {
      path: '/telescope/socket.io',
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to Telescope server');
    });

    newSocket.on('connect_error', error => {
      console.error('Connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <Flex gap="middle" wrap>
      <Layout style={{ height: '100vh', display: 'flex', flexDirection: 'row' }}>
        <Sider
          theme={isDarkMode ? 'dark' : 'light'}
          style={{ height: '100vh', position: 'fixed', left: 0 }}
        >
          <div
            style={{
              padding: 16,
              paddingLeft: 20,
              fontSize: 20,
              fontWeight: 600,
            }}
            className="logo font-bold"
          >
            Telescope
          </div>
          <Menu
            theme={isDarkMode ? 'dark' : 'light'}
            mode="inline"
            defaultSelectedKeys={[selectedMenu]}
          >
            <Menu.Item
              key="/requests"
              icon={<DatabaseOutlined />}
              onClick={() => setSelectedMenu('requests')}
            >
              <Link to="/requests">Requests</Link>
            </Menu.Item>

            <Menu.Item
              key="/exceptions"
              icon={<CodeOutlined />}
              onClick={() => setSelectedMenu('exceptions')}
            >
              <Link to="/exceptions">Exceptions</Link>
            </Menu.Item>
            <Menu.Item
              key="/queries"
              icon={<ClockCircleOutlined />}
              onClick={() => setSelectedMenu('schedule')}
            >
              <Link to="/queries">Queries</Link>
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout
          style={{
            marginLeft: 200,
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
          }}
        >
          <Layout.Header
            style={{
              textAlign: 'center',
              height: 64,
              paddingInline: 48,
              lineHeight: '64px',
              background: token.colorBgContainer,
              color: token.colorText,
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Flex gap="middle" align="end" vertical>
              <ThemeToggle />
            </Flex>
          </Layout.Header>
          <Layout>
            <Content style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
              <Routes>
                <Route path="/" element={<Navigate to="/requests" replace />} />
                <Route path="/requests" element={<Requests socket={socket} />} />
                <Route path="/requests/:id" element={<RequestDetails socket={socket} />} />
                <Route path="/exceptions" element={<Exceptions socket={socket} />} />
                <Route path="/exceptions/:id" element={<ExceptionDetails socket={socket} />} />
                <Route path="/queries" element={<Queries socket={socket} />} />
                <Route path="/queries/:id" element={<QueryDetails socket={socket} />} />
              </Routes>
            </Content>
          </Layout>
          {/* <Footer style={footerStyle}>Footer</Footer> */}
        </Layout>
      </Layout>
    </Flex>
  );
};
export default LayoutComponent;
