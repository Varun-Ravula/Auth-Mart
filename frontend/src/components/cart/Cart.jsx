import React from 'react'
import { useContext, useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Divider, Empty, InputNumber, Row, Space, Typography, message, Modal, Form, Input } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined, ShoppingOutlined } from '@ant-design/icons';
import axios from 'axios';
import { LoginContext } from '../../ContextApis/LoginContext';
import './Cart.css';

function Cart() {
  const [user] = useContext(LoginContext);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({ street: '', city: '', state: '', zipCode: '' });
  const cartApiBaseUrl = import.meta.env.VITE_CART_API_BASE_URL || 'http://localhost:5000/user-api';
  const authHeaders = {
    Authorization: `Bearer ${sessionStorage.getItem('token')}`
  };

  const refreshCart = async () => {
    if (!user?.email) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${cartApiBaseUrl}/cart/${encodeURIComponent(user.email)}`, {
        headers: authHeaders
      });
      setCartItems(response.data.payload || []);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Unable to load cart';
      message.error(errorMessage);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [user?.email]);

  useEffect(() => {
    const scriptId = 'razorpay-sdk-script';
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const subtotal = useMemo(() => cartItems.reduce((total, item) => total + (Number(item.price) || 0) * item.quantity, 0), [cartItems]);
  const formattedSubtotal = subtotal.toFixed(2);

  const handleQuantityChange = async (productId, quantity) => {
    try {
      await axios.put(
        `${cartApiBaseUrl}/cart/${encodeURIComponent(user.email)}/${productId}`,
        { quantity: quantity || 0 },
        { headers: authHeaders }
      );
      refreshCart();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Unable to update cart';
      message.error(errorMessage);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await axios.delete(`${cartApiBaseUrl}/cart/${encodeURIComponent(user.email)}/${productId}`, {
        headers: authHeaders
      });
      refreshCart();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Unable to remove cart item';
      message.error(errorMessage);
    }
  };

  const handleClearCart = async () => {
    try {
      await axios.delete(`${cartApiBaseUrl}/cart/${encodeURIComponent(user.email)}`, {
        headers: authHeaders
      });
      refreshCart();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Unable to clear cart';
      message.error(errorMessage);
    }
  };

  const paymentApiBaseUrl = import.meta.env.VITE_PAYMENT_API_BASE_URL || 'http://localhost:5000/payment-api';

  const triggerRazorpayPayment = async (addressValues) => {
    try {
      setLoading(true);

      const orderUrl = `${paymentApiBaseUrl}/create-order/${encodeURIComponent(user.email)}`;
      const orderResponse = await axios.post(orderUrl, { shippingAddress: addressValues }, { headers: authHeaders });
      const orderData = orderResponse.data.payload;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_yourKeyIdPlaceholder',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'AuthMart Store',
        description: 'Order Checkout Payment (Test Mode)',
        order_id: orderData.id,
        handler: async function (response) {
          try {
            setLoading(true);
            const verifyUrl = `${paymentApiBaseUrl}/verify-signature/${encodeURIComponent(user.email)}`;
            const verifyResponse = await axios.post(
              verifyUrl,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                shippingAddress: addressValues
              },
              { headers: authHeaders }
            );

            if (verifyResponse.data.payload?.verified) {
              message.success('Payment completed and verified successfully!');
              setCartItems([]);
            } else {
              message.error('Payment verification failed.');
            }
          } catch (err) {
            const errMsg = err.response?.data?.message || err.message || 'Signature verification failed';
            message.error(errMsg);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user.userName || '',
          email: user.email || '',
          contact: user.mobile || ''
        },
        notes: {
          address: `${addressValues.street}, ${addressValues.city}, ${addressValues.state} - ${addressValues.zipCode}`
        },
        theme: {
          color: '#3b82f6'
        },
        modal: {
          ondismiss: function () {
            message.info('Payment window closed by user.');
          }
        }
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        message.error('Razorpay SDK failed to load. Please try refreshing.');
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Could not initiate checkout';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutClick = () => {
    if (cartItems.length === 0) {
      message.warning('Your cart is empty');
      return;
    }
    setAddressModalOpen(true);
  };

  const handleAddressSubmit = (values) => {
    setShippingAddress(values);
    setAddressModalOpen(false);
    triggerRazorpayPayment(values);
  };

  return (
    <div className="cart-page">
      <Typography.Title level={3} className="cart-heading">Your cart</Typography.Title>
      {loading ? (
        <div className="cart-loading">
          <Typography.Text type="secondary">Loading cart...</Typography.Text>
        </div>
      ) : cartItems.length === 0 ? (
        <Empty
          className='mt-5'
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Typography.Text type="secondary">
              Your cart is empty. Add a product from the catalog to start building your order.
            </Typography.Text>
          }
        />
      ) : (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Row gutter={[16, 16]}>
              {cartItems.map((item) => (
                <Col key={item._id} xs={24} sm={12} xl={8}>
                  <Card
                    className="cart-item-card"
                    bordered={false}
                    cover={
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className="cart-item-image"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://static.vecteezy.com/system/resources/previews/026/279/318/non_2x/failed-to-upload-photo-size-limit-file-too-large-concept-illustration-flat-design-eps10-modern-graphic-element-for-landing-page-empty-state-ui-infographic-icon-vector.jpg';
                        }}
                      />
                    }
                    actions={[
                      <Space key="quantity" size="small" className="cart-item-quantity">
                        <Typography.Text>Qty</Typography.Text>
                        <InputNumber min={1} value={item.quantity} onChange={(value) => handleQuantityChange(item._id, value)} />
                      </Space>,
                      <Button key="remove" danger icon={<DeleteOutlined />} onClick={() => handleRemove(item._id)}>
                        Remove
                      </Button>
                    ]}
                  >
                    <Card.Meta
                      title={item.product_name}
                      description={
                        <Space direction="vertical" size={0}>
                          <Typography.Text type="secondary">₹{item.price} each</Typography.Text>
                          <Typography.Text>Colour: {item.color}</Typography.Text>
                          <Typography.Text>Size: {item.size}</Typography.Text>
                        </Space>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
          <Col xs={24} lg={8}>
            <Card className="cart-summary-card" bordered={false}>
              <Typography.Title level={5}>Order summary</Typography.Title>
              <Divider />
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Typography.Text>Items: {cartItems.length}</Typography.Text>
                <Typography.Text strong>Total: ₹{formattedSubtotal}</Typography.Text>
                <Button type="primary" icon={<ShoppingOutlined />} block onClick={handleCheckoutClick}>
                  Checkout
                </Button>
                <Button icon={<ShoppingCartOutlined />} block onClick={handleClearCart}>
                  Clear cart
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      )}

      <Modal
        title="Confirm Shipping Address"
        open={addressModalOpen}
        onCancel={() => setAddressModalOpen(false)}
        footer={null}
        destroyOnClose
        centered
        className="shipping-address-modal"
      >
        <Form layout="vertical" onFinish={handleAddressSubmit} initialValues={shippingAddress}>
          <Form.Item name="street" label="Street Address" rules={[{ required: true, message: 'Please enter street address' }]}>
            <Input placeholder="123 Main St, Apartment 4B" />
          </Form.Item>
          <Form.Item name="city" label="City" rules={[{ required: true, message: 'Please enter city' }]}>
            <Input placeholder="New Delhi" />
          </Form.Item>
          <Form.Item name="state" label="State" rules={[{ required: true, message: 'Please enter state' }]}>
            <Input placeholder="Delhi" />
          </Form.Item>
          <Form.Item name="zipCode" label="Zip Code / Postal Code" rules={[{ required: true, message: 'Please enter zip code' }]}>
            <Input placeholder="110001" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setAddressModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Proceed to Payment</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Cart;