import React, { useContext } from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';
// importing an image 
import pageNotFound from './images/page not found.svg';
import { Button, Card, Typography, Space } from 'antd';
import { LoginContext } from './ContextApis/LoginContext';
import { MdDashboard, MdHome } from 'react-icons/md';

function ErrorPage() {
  const routeError = useRouteError();
  const navigate = useNavigate();
  const [user, errorInLogin, userLoginStatus] = useContext(LoginContext);

  return (
    <div>
      <Card bordered={false} className="m-auto mt-5 text-center" style={{ maxWidth: 720, background: 'var(--app-surface)', color: 'var(--app-text)', boxShadow: 'var(--app-shadow)', borderRadius: '20px' }}>
        <img src={pageNotFound} alt="page not found" width="350px" className='d-block m-auto mb-4'/>
        <Typography.Title level={2} style={{ color: 'var(--app-text)' }}>Oops! something went wrong in Routing.</Typography.Title>
        <Typography.Paragraph style={{ color: 'var(--app-text-soft)', marginBottom: 24 }}>
          Error Status: {routeError.statusText || routeError.message || 'Page Not Found'}
        </Typography.Paragraph>
        <Space size="middle">
          {userLoginStatus ? (
            <Button type="primary" size="large" onClick={() => navigate('/dashboard/products')} icon={<MdDashboard />}>
              Go to Dashboard
            </Button>
          ) : (
            <Button type="primary" size="large" onClick={() => navigate('/')} icon={<MdHome />}>
              Go to Home
            </Button>
          )}
        </Space>
      </Card>
    </div>
  )
}

export default ErrorPage;