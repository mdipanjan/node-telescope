import React from 'react';
import { Switch } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="absolute bottom-4 left-4">
      <Switch
        checked={isDarkMode}
        onChange={toggleTheme}
        checkedChildren={<BulbOutlined />}
        unCheckedChildren={<BulbFilled />}
      />
    </div>
  );
};

export default ThemeToggle;
