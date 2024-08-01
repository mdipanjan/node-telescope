import './App.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { ConfigProvider, theme } from 'antd';
import LayoutComponent from './layout/Layout';
import { ThemeProvider } from './context/ThemeContext';
import { useState } from 'react';
import { RoutePrefixProvider } from './context/RoutePrefixContext';
import { ErrorFallback } from './components/ErrorFallback';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  return (
    <div>
      <RoutePrefixProvider>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Router>
            <ThemeProvider isDarkMode={isDarkMode} toggleTheme={toggleTheme}>
              <ConfigProvider
                theme={{
                  algorithm: [...(isDarkMode ? [theme.darkAlgorithm] : [theme.defaultAlgorithm])],
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
            </ThemeProvider>
          </Router>
        </ErrorBoundary>
      </RoutePrefixProvider>
    </div>
  );
}

export default App;
