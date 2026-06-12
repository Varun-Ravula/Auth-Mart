import React, { useEffect, useState } from 'react';
import NavigationBar from './components/navigationBar/NavigationBar';
import Footer from './components/footer/Footer';
import { Outlet } from 'react-router-dom';
import './RootLayout.css';
import LoginStore from './ContextApis/LoginStore'; 
import { ConfigProvider, Layout, theme as antdTheme } from 'antd';

function RootLayout() {
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('app-theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    localStorage.setItem('app-theme', themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((currentMode) => (currentMode === 'dark' ? 'light' : 'dark'));
  };

  return (
    <LoginStore>
      <ConfigProvider theme={{ algorithm: themeMode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm }}>
        <Layout className="app-shell">
          <NavigationBar themeMode={themeMode} onToggleTheme={toggleTheme} />
          <Layout.Content className="app-content">
            <Outlet />
          </Layout.Content>
          <Layout.Footer className="app-footer">
            <Footer themeMode={themeMode} />
          </Layout.Footer>
        </Layout>
      </ConfigProvider>
    </LoginStore>
  );
}

export default RootLayout;
