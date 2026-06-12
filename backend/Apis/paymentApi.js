const express = require('express');
const paymentApp = express.Router();
const asyncHandler = require('express-async-handler');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { ObjectId } = require('mongodb');

// Import token verification middleware
const verifyToken = require('../middleware/verifyToken');

// Initialize Razorpay client
// Note: In test mode, make sure to add key_id and key_secret in backend/.env
const getRazorpayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
};

paymentApp.use(express.json());

// Endpoint to create a Razorpay order
paymentApp.post('/create-order/:email', verifyToken, asyncHandler(async (request, response) => {
    const emailInParams = request.params.email;
    const usersCollection = request.app.get('usersCollection');
    const productsCollection = request.app.get('productsCollection');

    const user = await usersCollection.findOne({ email: emailInParams });
    if (!user) {
        return response.status(404).send({ message: 'User not found, please check credentials' });
    }

    const cartItems = Array.isArray(user.cartItems) ? user.cartItems : [];
    if (cartItems.length === 0) {
        return response.status(400).send({ message: 'Cannot place order, cart is empty' });
    }

    // Safely extract product IDs and fetch actual prices from productsCollection
    const productIds = cartItems.map((item) => item.productId).filter(Boolean);
    const productObjectIds = productIds
        .map((productId) => {
            try {
                return new ObjectId(productId);
            } catch {
                return null;
            }
        })
        .filter(Boolean);

    const products = await productsCollection.find({
        $or: [
            { _id: { $in: productObjectIds } },
            { _id: { $in: productIds } }
        ]
    }).toArray();

    // Calculate subtotal on the backend
    let subtotal = 0;
    cartItems.forEach((cartItem) => {
        const product = products.find((p) => p._id.toString() === cartItem.productId);
        if (product) {
            subtotal += (Number(product.price) || 0) * (cartItem.quantity || 1);
        }
    });

    if (subtotal <= 0) {
        return response.status(400).send({ message: 'Invalid total order amount calculated' });
    }

    // Razorpay expects the amount in the smallest currency unit (e.g. paise for INR)
    const amountInPaise = Math.round(subtotal * 100);

    const razorpay = getRazorpayInstance();
    const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_order_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    };

    const order = await razorpay.orders.create(options);
    response.status(200).send({
        message: 'Order created successfully',
        payload: {
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt
        }
    });
}));

// Endpoint to verify payment signature and empty the cart upon success
paymentApp.post('/verify-signature/:email', verifyToken, asyncHandler(async (request, response) => {
    const emailInParams = request.params.email;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = request.body;
    const usersCollection = request.app.get('usersCollection');

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return response.status(400).send({ message: 'Missing payment details for signature verification' });
    }

    // Verify signature using SHA-256 HMAC
    const textToHash = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(textToHash.toString())
        .digest('hex');

    if (expectedSignature === razorpay_signature) {
        // Clear the user's cart in the DB upon successful payment
        await usersCollection.updateOne(
            { email: emailInParams },
            { $set: { cartItems: [] } }
        );

        response.status(200).send({
            message: 'Payment verified and order processed successfully',
            payload: {
                verified: true,
                paymentId: razorpay_payment_id
            }
        });
    } else {
        response.status(400).send({
            message: 'Payment verification failed, invalid signature detected',
            payload: {
                verified: false
            }
        });
    }
}));

module.exports = paymentApp;
