import './Products.css';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Col, Empty, Modal, Rate, Row, Space, Spin, Typography, Alert, Descriptions, message } from 'antd';
import { ShoppingCartOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { LoginContext } from '../../ContextApis/LoginContext';
import axios from 'axios';

function Products() {
    const navigate = useNavigate();
    const [user, , , setUserLoginStatus, , setUser] = useContext(LoginContext);
    // products state
    const [products, setProducts] = useState([]);
    // error  state
    const [error, setError] = useState("");
    const [initialLoading, setInitialLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [visibleCount, setVisibleCount] = useState(6);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [showViewCartButton, setShowViewCartButton] = useState(false);

    // quantity state per product
    const [quantityMap, setQuantityMap] = useState({});
    const loadMoreSentinelRef = useRef(null);
    const pageSize = 6;

    // function for incrementing quantity
    const incrementQuantity = (productId) => {
        setQuantityMap((current) => ({
            ...current,
            [productId]: (current[productId] || 0) + 1
        }));
    }

    // function for decrementing quantity
    const decrementQuantity = (productId) => {
        setQuantityMap((current) => ({
            ...current,
            [productId]: Math.max((current[productId] || 0) - 1, 0)
        }));
    }

    const visibleProducts = useMemo(() => products, [products]);

    const products_url = import.meta.env.VITE_PRODUCTS_URL;
    const productsPageSize = 6;
    const authHeaders = {
        Authorization: `Bearer ${sessionStorage.getItem('token')}`
    };

    const changedProducts = useMemo(() => {
        return products
            .filter((product) => (quantityMap[product._id] || 0) > 0)
            .map((product) => ({
                product,
                quantity: quantityMap[product._id] || 0
            }));
    }, [products, quantityMap]);

    const hasChangedProducts = changedProducts.length > 0;

    const handleAddToCart = async () => {
        if (!hasChangedProducts) {
            return;
        }

        try {
            await axios.post(
                `${import.meta.env.VITE_CART_API_BASE_URL || 'http://localhost:5000/user-api'}/cart/${encodeURIComponent(user.email)}`,
                {
                    items: changedProducts.map(({ product, quantity }) => ({
                        productId: product._id,
                        quantity
                    }))
                },
                { headers: authHeaders }
            );

            setQuantityMap((current) => {
                const nextQuantityMap = { ...current };

                changedProducts.forEach(({ product }) => {
                    nextQuantityMap[product._id] = 0;
                });

                return nextQuantityMap;
            });

            setShowViewCartButton(true);
            message.success(`Added ${changedProducts.length} product${changedProducts.length === 1 ? '' : 's'} to cart`);
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Unable to add selected products to cart';
            message.error(errorMessage);
        }
    };

    const handleMoreDetails = (product) => {
        setSelectedProduct(product);
        setDetailsModalOpen(true);
    };

    const closeDetailsModal = () => {
        setDetailsModalOpen(false);
        setSelectedProduct(null);
    };

    // using use effect to load the products intially when the component is loaded
    useEffect(() => {
        const controller = new AbortController();

        const loadProducts = async () => {
            try {
                if (page === 1) {
                    setInitialLoading(true);
                } else {
                    setLoadingMore(true);
                }

                const response = await axios.get(`${products_url}?page=${page}&limit=${productsPageSize}`, {
                    headers: authHeaders,
                    signal: controller.signal
                });

                const nextProducts = response.data.payload || [];
                setProducts((current) => (page === 1 ? nextProducts : [...current, ...nextProducts]));
                setHasMore(Boolean(response.data.meta?.hasMore));
            } catch (errorMessage) {
                if (controller.signal.aborted) {
                    return;
                }

                const errorText = errorMessage.response?.data?.message || errorMessage.message || String(errorMessage);
                setError(errorText);
                if (errorText.toLowerCase().includes('session has been expired')) {
                    setUserLoginStatus(false);
                    setUser({});
                    sessionStorage.clear();
                    setTimeout(() => navigate('/login'), 1200);
                }
            } finally {
                setInitialLoading(false);
                setLoadingMore(false);
            }
        };

        loadProducts();

        return () => controller.abort();
    }, [page]);

    useEffect(() => {
        if (!hasMore || products.length === 0 || initialLoading) {
            setLoadingMore(false);
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            const [entry] = entries;
            if (entry.isIntersecting && !loadingMore) {
                setPage((current) => current + 1);
            }
        }, { threshold: 0.35 });

        const sentinel = loadMoreSentinelRef.current;
        if (sentinel) {
            observer.observe(sentinel);
        }

        return () => observer.disconnect();
    }, [hasMore, products.length, initialLoading, loadingMore]);

    // console.log(products);

    return (
        <div className="productsContent mt-2 mb-5">
            <div className="row">
                {error.length !== 0 ? <div className="m-auto col-12">
                    <Alert
                        type="error"
                        showIcon
                        className="mt-3"
                        message="Unable to load products"
                        description={error}
                    />
                </div> : <div className="m-auto col-12">
                    <Typography.Title level={4} className='text-center mb-2 products-heading'>Live product catalog</Typography.Title>
                    <Typography.Paragraph className='text-center products-subheading'>Scroll to load more items progressively.</Typography.Paragraph>

                    {initialLoading ? (
                        <div className="products-loading">
                            <Spin size="large" tip="Loading products..." />
                        </div>
                    ) : products.length === 0 ? (
                        <Empty description="No products available yet" />
                    ) : (
                        <>
                            <Row gutter={[16, 16]}>
                                {visibleProducts.map((product) => (
                                    <Col key={product._id} xs={24} sm={12} lg={8}>
                                        <Card
                                            className='product-card'
                                            cover={
                                                <img
                                                    src={product.image_url}
                                                    alt={product.product_name}
                                                    className="product-card-image"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=600&auto=format&fit=crop';
                                                    }}
                                                />
                                            }
                                            actions={[
                                                <Button type="text" key="details" onClick={() => handleMoreDetails(product)}>More details</Button>,
                                                <Space key="quantity" size="small">
                                                    <Button icon={<MinusOutlined />} onClick={() => decrementQuantity(product._id)} />
                                                    <Typography.Text strong>{quantityMap[product._id] || 0}</Typography.Text>
                                                    <Button icon={<PlusOutlined />} onClick={() => incrementQuantity(product._id)} />
                                                </Space>
                                            ]}
                                        >
                                            <Card.Meta
                                                title={product.product_name}
                                                description={
                                                    <Space direction="vertical" size={0}>
                                                        <Typography.Text>Price: <b>₹{product.price}</b></Typography.Text>
                                                        <Typography.Text>Colour: <b>{product.color}</b></Typography.Text>
                                                        <Typography.Text>Size: <b>{product.size}</b></Typography.Text>
                                                    </Space>
                                                }
                                            />
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                            <div ref={loadMoreSentinelRef} className="products-sentinel">
                                {loadingMore && <Spin tip="Loading more products..." />}
                                {!loadingMore && hasMore && <Typography.Text type="secondary">Keep scrolling to load more</Typography.Text>}
                            </div>
                        </>
                    )}
                </div>
                }
            </div>

            <Modal
                open={detailsModalOpen}
                onCancel={closeDetailsModal}
                footer={null}
                width={900}
                centered
                destroyOnClose
                className="product-details-modal"
                styles={{
                    mask: {
                        // Applies the frosted glass blur effect
                        backdropFilter: 'blur(6px)',
                        // Optional: adjusts background dimness overlay
                        backgroundColor: 'rgba(0, 0, 0, 0.45)',
                    },
                }}
            >
                {selectedProduct && (
                    <div className="product-details-layout">
                        <img
                            src={selectedProduct.image_url}
                            alt={selectedProduct.product_name}
                            className="product-details-image"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://static.vecteezy.com/system/resources/previews/026/279/318/non_2x/failed-to-upload-photo-size-limit-file-too-large-concept-illustration-flat-design-eps10-modern-graphic-element-for-landing-page-empty-state-ui-infographic-icon-vector.jpg';
                            }}
                        />
                        <div className="product-details-content">
                            <Typography.Title level={3} style={{ marginBottom: 4 }}>{selectedProduct.product_name}</Typography.Title>
                            <Typography.Text type="secondary" className="d-block mb-3">Full product information</Typography.Text>
                            <Descriptions bordered column={1} size="small">
                                <Descriptions.Item label="Price">₹{selectedProduct.price}</Descriptions.Item>
                                <Descriptions.Item label="Colour">{selectedProduct.color}</Descriptions.Item>
                                <Descriptions.Item label="Size">{selectedProduct.size}</Descriptions.Item>
                                <Descriptions.Item label="Product ID">{selectedProduct._id}</Descriptions.Item>
                                <Descriptions.Item label="Rating">
                                    <Rate allowHalf disabled value={Number(selectedProduct.rating) || 0} />
                                </Descriptions.Item>
                            </Descriptions>
                        </div>
                    </div>
                )}
            </Modal>

            {hasChangedProducts && (
                <div className="sticky-cart-action">
                    <div className="sticky-cart-summary">
                        <Typography.Text className="sticky-cart-label">Ready to add</Typography.Text>
                        <Typography.Title level={5} className="sticky-cart-title">
                            {changedProducts.length} changed item{changedProducts.length === 1 ? '' : 's'}
                        </Typography.Title>
                    </div>
                    <Button
                        type="primary"
                        size="large"
                        icon={<ShoppingCartOutlined />}
                        onClick={handleAddToCart}
                        className="sticky-cart-button"
                    >
                        Add to cart
                    </Button>
                </div>
            )}

            {showViewCartButton && !hasChangedProducts && (
                <div className="sticky-cart-action">
                    <div className="sticky-cart-summary">
                        <Typography.Text className="sticky-cart-label">Cart updated</Typography.Text>
                        <Typography.Title level={5} className="sticky-cart-title">
                            Items added!
                        </Typography.Title>
                    </div>
                    <Button
                        type="primary"
                        size="large"
                        icon={<ShoppingCartOutlined />}
                        onClick={() => navigate('/dashboard/cart')}
                        className="sticky-cart-button"
                        style={{ backgroundColor: '#22c55e', borderColor: '#22c55e' }}
                    >
                        View cart
                    </Button>
                </div>
            )}
        </div>
    )
}

export default Products;