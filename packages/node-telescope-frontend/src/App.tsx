import './App.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import LayoutComponent from './layout/Layout';
import { ThemeProvider } from './context/ThemeContext';
import React, { useState } from 'react';
import { RoutePrefixProvider } from './context/RoutePrefixContext';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  return (
    <div>
      <Router>
        <ThemeProvider isDarkMode={isDarkMode} toggleTheme={toggleTheme}>
          <RoutePrefixProvider>
            <ConfigProvider
              theme={{
                algorithm: [
                  // theme.compactAlgorithm,
                  ...(isDarkMode ? [theme.darkAlgorithm] : [theme.defaultAlgorithm]),
                ],
                token: {
                  colorPrimary: '#289976',
                  colorBgContainer: isDarkMode ? '#141414' : '#ffffff',
                  colorBgElevated: isDarkMode ? '#1f1f1f' : '#ffffff',
                  colorBorderSecondary: isDarkMode ? '#303030' : '#f0f0f0',
                },
              }}
            >
              <LayoutComponent />
            </ConfigProvider>
          </RoutePrefixProvider>
        </ThemeProvider>
      </Router>
    </div>
  );
}

export default App;
