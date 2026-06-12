import React, { useContext, useState } from 'react';
import productLogo from '../../images/product-image.avif';
import './NavigationBar.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoginContext } from '../../ContextApis/LoginContext';
import { Avatar, Button, Divider, Modal, Popover, Space, Spin, Switch, Typography, message } from 'antd';
import { HomeOutlined, UserAddOutlined, LoginOutlined, InfoCircleOutlined, UserOutlined, BulbOutlined, MoonOutlined, DashboardOutlined, LogoutOutlined } from '@ant-design/icons';
import axios from 'axios';
import Register from '../register/Register';
import { MdDashboard } from 'react-icons/md';

function NavigationBar({ themeMode, onToggleTheme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileInitialValues, setProfileInitialValues] = useState({});

  // importing the states from login context
  const [user, errorInLogin, userLoginStatus, setUserLoginStatus, loginUser, setUser] = useContext(LoginContext);
  const userApiBaseUrl = import.meta.env.VITE_USER_API_BASE_URL || 'http://localhost:5000/user-api';

  // function to log out
  const logOut = () => {
    setUserLoginStatus(false);
    setUser({});
    sessionStorage.clear();
    message.success('Logged out successfully');
    navigate('/');

  }

  const closeProfileModal = () => {
    setProfileModalOpen(false);
    setProfileLoading(false);
  };

  const handleProfileUpdateSuccess = (responseData) => {
    const updatedUser = responseData?.payload;
    if (updatedUser) {
      setUser(updatedUser);
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
    }
    message.success(responseData?.message || 'Profile updated successfully');
    closeProfileModal();
  };

  const openProfileEditor = async () => {
    try {
      setProfileLoading(true);
      const response = await axios.get(`${userApiBaseUrl}/get-user/${encodeURIComponent(user.email)}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      setProfileInitialValues(response.data.payload || {});
      setProfileModalOpen(true);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Unable to load profile';
      message.error(errorMessage);
    } finally {
      setProfileLoading(false);
    }
  };

  const profilePopoverContent = (
    <div className="profile-popover-content">
      <Space align="center" size="middle">
        <Avatar size={48} src={user.image} icon={<UserOutlined />} />
        <div>
          <Typography.Text strong className="profile-name">{user.userName || 'Logged in user'}</Typography.Text>
          <Typography.Text className="profile-email">{user.email}</Typography.Text>
        </div>
      </Space>
      <Divider className="profile-popover-divider" />
      <Space direction="vertical" size={6} style={{ width: '100%' }}>
        <Typography.Text className="profile-label">Status</Typography.Text>
        <Typography.Text className="profile-value">Successfully logged in</Typography.Text>
        <Button type="primary" block onClick={openProfileEditor}>
          Update profile
        </Button>
        <Button danger block icon={<LogoutOutlined />} onClick={logOut}>
          Logout
        </Button>
      </Space>
    </div>
  );

  return (
    <header className="navigation-bar">
      <div className="nav-brand" role="button" tabIndex={0} onClick={() => navigate('/')}>
        <img src={productLogo} alt="product logo" width="40px" style={{ borderRadius: '50%' }} />
        <div>
          <Typography.Text className="brand-title">AuthMart</Typography.Text>
          <Typography.Text className="brand-subtitle">Product management platform</Typography.Text>
        </div>
      </div>

      <Space wrap size="middle" className="nav-actions">
        <Button type={location.pathname === '/' ? 'primary' : 'text'} icon={<HomeOutlined />} onClick={() => navigate('/')}>
          Home
        </Button>
        {userLoginStatus && (
          <Button type={location.pathname.startsWith('/dashboard') ? 'primary' : 'text'} icon={<MdDashboard />} onClick={() => navigate('/dashboard/products')}>
            Dashboard
          </Button>
        )}
        <Button type={location.pathname === '/about-us' ? 'primary' : 'text'} icon={<InfoCircleOutlined />} onClick={() => navigate('/about-us')}>
          About us
        </Button>
        {!userLoginStatus && (
          <>
            <Button type={location.pathname === '/register' ? 'primary' : 'text'} icon={<UserAddOutlined />} onClick={() => navigate('/register')}>
              Register
            </Button>
            <Button type={location.pathname === '/login' ? 'primary' : 'text'} icon={<LoginOutlined />} onClick={() => navigate('/login')}>
              Login
            </Button>
          </>
        )}
        <Space className="theme-switch-wrap" align="center">
          <BulbOutlined className="theme-icon" />
          <Switch
            checked={themeMode === 'dark'}
            onChange={onToggleTheme}
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<BulbOutlined />}
            aria-label="Toggle dark and light theme"
          />
        </Space>
        {userLoginStatus && (
          <Popover content={profilePopoverContent} trigger="click" placement="bottomRight">
            <button className="nav-profile-button" type="button" aria-label="Open profile menu">
              <Avatar size={40} src={user.image} icon={<UserOutlined />} />
            </button>
          </Popover>
        )}
      </Space>

      <Modal
        title="Update Profile"
        open={profileModalOpen}
        onCancel={closeProfileModal}
        footer={null}
        destroyOnClose
        width={720}
      >
        {profileLoading ? (
          <div style={{ minHeight: 240, display: 'grid', placeItems: 'center' }}>
            <Spin tip="Loading profile details..." />
          </div>
        ) : (
          <Register
            mode="edit"
            initialValues={profileInitialValues}
            onCancel={closeProfileModal}
            onSubmitSuccess={handleProfileUpdateSuccess}
            submitLabel="Update profile"
          />
        )}
      </Modal>
    </header>
  )
}

export default NavigationBar;