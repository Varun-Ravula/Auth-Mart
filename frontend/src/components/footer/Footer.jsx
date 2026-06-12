import React from 'react'
import './Footer.css';
import { Typography, Space } from 'antd';

function Footer() {
  return (
    <div className="footerContent mt-3">
      <Space direction="vertical" align="center" size={0}>
        <Typography.Title level={4} className="footer-title">Contact Details</Typography.Title>
        <Typography.Text className="footer-text">Production-ready product management workspace</Typography.Text>
      </Space>
    </div>
  )
}

export default Footer;