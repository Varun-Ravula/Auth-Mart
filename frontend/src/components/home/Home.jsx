import React, { useContext } from 'react';
import './Home.css';
import productImage from '../../images/product management.jpg';

// importing the installed modules
import { MdPersonAddAlt1, MdDashboard } from "react-icons/md";
import { LuLogIn } from "react-icons/lu";
import { useNavigate } from 'react-router-dom';
import { Button, Card, Col, Row, Space, Typography, Tag } from 'antd';
import { LoginContext } from '../../ContextApis/LoginContext';

function Home() {
  // use navigate
  const navigate = useNavigate();
  const [user, errorInLogin, userLoginStatus] = useContext(LoginContext);

  const featureCards = [
    { title: 'Secure auth', description: 'JWT login, protected routes, and profile uploads.' },
    { title: 'Product flow', description: 'Infinite scrolling product catalog and cart actions.' },
    { title: 'Responsive UI', description: 'Layout that adapts cleanly across desktop and mobile.' }
  ];

  return (
    <div className="container home-page">
      <Row gutter={[24, 24]} align="middle">
        <Col xs={24} lg={12}>
          <Space direction="vertical" size="large">
            <Typography.Title level={1} className="home-main-heading">
              Secure Product Management,
            </Typography.Title>
            <Typography.Paragraph className="home-copy">
              Register, log in, and manage products in a cleaner workspace with protected access and a modern interface.
            </Typography.Paragraph>
            <Space wrap>
              <Tag color="blue">JWT Authentication</Tag>
              <Tag color="green">Password Hashing</Tag>
              <Tag color="gold">Paymemt Integration</Tag>
            </Space>
            <Space>
              {!userLoginStatus ? (
                <>
                  <Button type="primary" size="large" onClick={() => navigate('/register')} icon={<MdPersonAddAlt1 />}>
                    Register
                  </Button>
                  <Button size="large" onClick={() => navigate('/login')} icon={<LuLogIn />}>
                    Login
                  </Button>
                </>
              ) : (
                <Button type="primary" size="large" onClick={() => navigate('/dashboard/products')} icon={<MdDashboard />}>
                  Go to Dashboard
                </Button>
              )}
            </Space>
          </Space>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} className="home-hero-card">
            <img src={productImage} alt="product management" className="home-hero-image" />
            <Typography.Paragraph style={{ fontStyle: 'italic', color: 'var(--app-text-soft)' }}>
              "Experience a seamless workflow designed to simplify inventory tracking, product curation, and order fulfillment. Access your secure portal to begin managing your catalog."
            </Typography.Paragraph>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="home-feature-grid">
        {featureCards.map((feature) => (
          <Col key={feature.title} xs={24} md={8}>
            <Card bordered={false} className="home-feature-card">
              <Typography.Title level={4} className="home-feature-title">{feature.title}</Typography.Title>
              <Typography.Paragraph className="home-feature-copy">{feature.description}</Typography.Paragraph>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}

export default Home;