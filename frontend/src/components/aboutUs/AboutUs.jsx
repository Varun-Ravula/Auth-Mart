import React from 'react';
import productImage from '../../images/product_management_2.png';
import { Card, Col, Collapse, Row, Space, Steps, Tag, Typography } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, SmileOutlined } from '@ant-design/icons';
import './AboutUs.css';

function AboutUs() {
  const aboutPoints = [
    { title: 'Secure access', description: 'JWT-protected product and dashboard flow.' },
    { title: 'Profile uploads', description: 'Cloudinary-backed user photo management.' },
    { title: 'Shopping actions', description: 'Cart, quantity, and product browsing interactions.' }
  ];

  return (
    <div className="container about-page">
      <Typography.Title level={2} className="about-heading">Product Management System</Typography.Title>
      <Row justify="center">
        <Col xs={24} md={18} lg={12}>
          <Card bordered={false} className="about-card">
            <img src={productImage} alt="product management" className="about-image" />
            <Space wrap className="about-tags">
              <Tag color="blue">Responsive</Tag>
              <Tag color="green">Secure</Tag>
              <Tag color="gold">Interactive</Tag>
            </Space>
            <Typography.Paragraph className="about-copy">
              Register, log in, manage products, and update your profile in a cleaner dashboard-driven flow.
            </Typography.Paragraph>
            <Collapse
              className="about-collapse"
              items={[
                {
                  key: '1',
                  label: 'What you can do',
                  children: (
                    <Steps
                      direction="vertical"
                      current={4}
                      items={[
                        { title: 'Create an account', description: 'Upload your profile picture and register.' },
                        { title: 'Manage your dashboard', description: 'Browse products and use the cart tab.' },
                        { title: 'Secure checkout', description: 'Confirm shipping details and complete mock test payments via Razorpay.' },
                        { title: 'Edit your profile', description: 'Update profile details from the avatar popover.' }
                      ]}
                    />
                  )
                },
              ]}
            />
            <Row gutter={[12, 12]} className="about-points-row">
              {aboutPoints.map((point) => (
                <Col key={point.title} xs={24} md={8}>
                  <Card className="about-point-card" bordered={false}>
                    <CheckCircleOutlined className="about-point-icon" />
                    <Typography.Title level={5} className="about-point-title">{point.title}</Typography.Title>
                    <Typography.Paragraph className="about-point-copy">{point.description}</Typography.Paragraph>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default AboutUs;