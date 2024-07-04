import { useEffect, useState } from 'react';
import { Flex, Layout, Menu, message, theme } from 'antd';
import {
  DatabaseOutlined,
  CodeOutlined,
  ClockCircleOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import ThemeToggle from '../components/ThemeToggle';
import Requests from '../components/Requests';
import { io } from 'socket.io-client';
import { useTheme } from '../context/ThemeContext';

const LayoutComponent = () => {
  const { Sider, Content, Header, Footer } = Layout;
  const { isDarkMode, toggleTheme } = useTheme();
  const { token } = theme.useToken();

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    height: 64,
    paddingInline: 48,
    lineHeight: '64px',
    // backgroundColor: defineColor('background', currentTheme),
  };

  const footerStyle: React.CSSProperties = {
    textAlign: 'center',
  };

  const [selectedMenu, setSelectedMenu] = useState('requests');
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:4000', {
      path: '/telescope/socket.io',
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to Telescope');
      message.success('Connected to Telescope server');
    });

    newSocket.on('connect_error', error => {
      console.error('Connection error:', error);
      message.error(`Failed to connect to Telescope server: ${error.message}`);
    });

    setSocket(newSocket);

    return () => {
      console.log('Closing socket connection');
      newSocket.close();
    };
  }, []);
  return (
    <Flex gap="middle" wrap>
      <Layout style={{ height: '100vh' }}>
        <Sider theme={isDarkMode ? 'dark' : 'light'} className="h-screen">
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
            defaultSelectedKeys={['requests']}
          >
            <Menu.Item
              key="requests"
              icon={<DatabaseOutlined />}
              onClick={() => setSelectedMenu('requests')}
            >
              Requests
            </Menu.Item>
            <Menu.Item
              key="commands"
              icon={<CodeOutlined />}
              onClick={() => setSelectedMenu('commands')}
            >
              Commands
            </Menu.Item>
            <Menu.Item
              key="schedule"
              icon={<ClockCircleOutlined />}
              onClick={() => setSelectedMenu('schedule')}
            >
              Schedule
            </Menu.Item>
            <Menu.Item
              key="jobs"
              icon={<ScheduleOutlined />}
              onClick={() => setSelectedMenu('jobs')}
            >
              Jobs
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout>
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
            <Content
              style={{
                margin: 20,
              }}
              className="p-6"
            >
              {selectedMenu === 'requests' && <Requests socket={socket} />}
            </Content>
          </Layout>
          <Footer style={footerStyle}>Footer</Footer>
        </Layout>
      </Layout>
    </Flex>
  );
};
export default LayoutComponent;
