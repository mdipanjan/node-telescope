import { useEffect, useState } from 'react';
import { Flex, Layout, Menu, message } from 'antd';
import {
  DatabaseOutlined,
  CodeOutlined,
  ClockCircleOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import ThemeToggle from '../components/ThemeToggle';
import Requests from '../components/Requests';
import { gray, purple } from '@ant-design/colors';
import { io } from 'socket.io-client';

const LayoutComponent = () => {
  const { Sider, Content, Header, Footer } = Layout;
  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    color: '#fff',
    height: 64,
    paddingInline: 48,
    lineHeight: '64px',
    backgroundColor: '#fff',
  };

  const footerStyle: React.CSSProperties = {
    textAlign: 'center',
    color: '#fff',
    backgroundColor: '#fff',
  };

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selectedMenu, setSelectedMenu] = useState('requests');
  const [socket, setSocket] = useState<any>(null);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  useEffect(() => {
    const newSocket = io('http://localhost:8000/telescope', {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      message.success('Connected to Telescope server');
    });

    newSocket.on('connect_error', error => {
      console.error('Socket connection error:', error);
      message.error('Failed to connect to Telescope server');
    });

    newSocket.on('disconnect', reason => {
      console.log('Socket disconnected:', reason);
      message.warning('Disconnected from Telescope server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <Flex gap="middle" wrap>
      <Layout style={{ height: '100vh' }}>
        <Sider theme={theme} className="h-screen">
          <div
            style={{
              padding: 16,
              paddingLeft: 20,
              fontSize: 20,
              fontWeight: 600,
              color: theme === 'light' ? purple[9] : gray[1],
            }}
            className="logo font-bold"
          >
            Telescope
          </div>
          <Menu theme={theme} mode="inline" defaultSelectedKeys={['requests']}>
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
          <Header style={headerStyle}>
            <Flex gap="middle" align="end" vertical>
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            </Flex>
          </Header>
          <Layout>
            <Content style={{ margin: 20 }} className="p-6">
              {selectedMenu === 'requests' && <Requests socket={socket} theme={theme} />}
            </Content>
          </Layout>
          <Footer style={footerStyle}>Footer</Footer>
        </Layout>
      </Layout>
    </Flex>
  );
};
export default LayoutComponent;
