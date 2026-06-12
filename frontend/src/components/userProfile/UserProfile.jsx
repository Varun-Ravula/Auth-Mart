// importing modules
import React,{ useContext } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LoginContext } from '../../ContextApis/LoginContext';
import "./UserProfile.css";
import { Avatar, Card, Space, Tabs, Typography } from 'antd';

function UserProfile() {
  // destructuring the states from context api
  const [user,errorInLogin,userLoginStatus,setUserLoginStatus,loginUser]=useContext(LoginContext);
  const navigate = useNavigate();
  const location = useLocation();

  const dashboardBase = '/dashboard';
  const activeTab = location.pathname.endsWith('/cart') ? 'cart' : 'products';

  const dashboardTabs = [
    { key: 'products', label: 'Products' },
    { key: 'cart', label: 'Cart' }
  ];

  return (
    <div className="dashboard-page">
          <div>
            <Typography.Title level={2} style={{ marginBottom: 0, textAlign: "center" }}>Welcome {user.userName || 'User'}</Typography.Title>
          </div>
      <Card className="dashboard-tabs-card" bordered={false}>
        <Typography.Title level={5} className="dashboard-title">Available categories</Typography.Title>
        <Tabs
          activeKey={activeTab}
          items={dashboardTabs}
          onChange={(key) => navigate(`${dashboardBase}/${key}`)}
        />
      </Card>
      <Outlet/>
    </div>
  )
}

export default UserProfile;