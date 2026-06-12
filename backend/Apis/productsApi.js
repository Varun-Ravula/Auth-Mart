const express = require('express');
// creating an mini application
const productsApp = express.Router();
// importig necessary modules
const asyncHandler = require('express-async-handler');

// importing an middleware
const verifyToken = require('../middleware/verifyToken');

// using body parser for every request
productsApp.use(express.json());

// creating an routes for request
productsApp.get('/get-products', verifyToken, asyncHandler(async (request, response) => {
    const productsCollection = request.app.get('productsCollection');
    const page = Math.max(parseInt(request.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(request.query.limit, 10) || 6, 1);
    const skip = (page - 1) * limit;

    const totalProducts = await productsCollection.countDocuments();
    const products = await productsCollection
        .find({})
        .sort({ price: 1, _id: 1 })
        .skip(skip)
        .limit(limit)
        .toArray();

    response.status(200).send({
        message: 'products list',
        payload: products,
        meta: {
            page,
            limit,
            totalProducts,
            hasMore: skip + products.length < totalProducts
        }
    });
}))

// exporting mini application
module.exports = productsApp;