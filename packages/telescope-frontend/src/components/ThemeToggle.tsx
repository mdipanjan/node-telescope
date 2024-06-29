import React from 'react';
import { Switch } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  return (
    <div className="absolute bottom-4 left-4">
      <Switch
        checked={theme === 'dark'}
        onChange={toggleTheme}
        checkedChildren={<BulbOutlined />}
        unCheckedChildren={<BulbFilled />}
      />
    </div>
  );
};

export default ThemeToggle;
