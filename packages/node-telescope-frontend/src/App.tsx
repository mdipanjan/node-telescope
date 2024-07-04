import './App.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import LayoutComponent from './layout/Layout';
import { ThemeProvider } from './context/ThemeContext';
import React, { useState } from 'react';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  return (
    <div>
      <ThemeProvider isDarkMode={isDarkMode} toggleTheme={toggleTheme}>
        <ConfigProvider
          theme={{
            algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
            token: {
              colorPrimary: '#00b96b',
              colorBgContainer: isDarkMode ? '#141414' : '#ffffff',
              colorBgElevated: isDarkMode ? '#1f1f1f' : '#ffffff',
              colorBorderSecondary: isDarkMode ? '#303030' : '#f0f0f0',
            },
          }}
        >
          <LayoutComponent />
        </ConfigProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
