// importing mini exress application
const express = require('express');
const userApp = express.Router();
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

// importing multer module to upload photos
const multerObject = require('../middleware/cloudinaryConfig');

// body parser
userApp.use(express.json());

// imorting middleware
const verifyToken = require('../middleware/verifyToken');

// creating an api
// registering user
userApp.post('/register-user', multerObject.single('profile'), asyncHandler(async (request, response) => {
    try {
        const usersCollection = request.app.get('usersCollection');
        // here accessig the request.body.user because we appended the details before in register component and converting them into general javascript object
        console.log(request.body);
        const registerUser = JSON.parse(request.body.user);
        delete registerUser.profilePicture;

        const userExist = await usersCollection.findOne({ email: registerUser.email });
        if (userExist !== null) {
            response.status(200).send({ message: "user already existed, Register with different email" })
        } else {
            const hashedPassword = await bcrypt.hash(registerUser.password, 5);
            if (hashedPassword == false) {
                response.send({ message: "error occured in hashed password" });
            } else {
                // accessing the path provided by the cloudinary service
                registerUser.image = request.file.path;
                registerUser.password = hashedPassword;
                await usersCollection.insertOne(registerUser);
                response.status(201).send({ message: "user registered successfully" });
            }
        }
    }
    catch (error) {
        console.log(error);
    }
}));

// user login
const secret_key = process.env.SECRET_KEY;

userApp.post('/login-user', asyncHandler(async (request, response) => {
    const usersCollection = request.app.get("usersCollection");
    const userFromRequest = request.body;
    const userExistInDb = await usersCollection.findOne({ email: userFromRequest.email });
    if (userExistInDb == null) {
        response.status(200).send({ message: "invalid credentials please check your credentials / if not registered, register first please" });
    } else {
        const compareHashedResult = await bcrypt.compare(userFromRequest.password, userExistInDb.password);
        if (compareHashedResult === false) {
            response.status(200).send({ message: "invalid password please try again!" });
        } else {
            const jwtToken = jwt.sign({ email: userFromRequest.email }, secret_key, { expiresIn: '15m' })
            delete userExistInDb.password;
            delete userExistInDb._id;
            response.status(200).send({ message: "success", token: jwtToken, payload: userExistInDb });
        }
    }
}))

// get users
userApp.get('/get-users', verifyToken, async (request, response) => {
    const usersCollection = request.app.get("usersCollection");
    const usersOfDb = await usersCollection.find().toArray();
    const purifiedUsers = usersOfDb.map(user => {
        const { password, _id, ...restProperties } = user;
        return restProperties;
    })
    response.status(200).send({ message: "users of db", payload: purifiedUsers });
})

// get-user by email
userApp.get('/get-user/:email', verifyToken, asyncHandler(async (request, response) => {
    const emailInParams = request.params.email;
    const usersCollection = request.app.get("usersCollection");
    const userInDb = await usersCollection.findOne({ email: emailInParams });
    if (userInDb == null) {
        response.status(404).send({ message: "user not found, please check your credentials" });
    }
    else {
        delete userInDb.profilePicture;
        delete userInDb.password;
        delete userInDb._id;
        response.status(200).send({ message: "user found", payload: userInDb });
    }
}))

// update-user by email

const mapCartItems = async (request, cartItems = []) => {
    const productsCollection = request.app.get('productsCollection');
    const cartProductIds = cartItems.map((item) => item.productId).filter(Boolean);
    const productObjectIds = cartProductIds
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
            { _id: { $in: cartProductIds } }
        ]
    }).toArray();

    return cartItems
        .map((cartItem) => {
            const product = products.find((productItem) => productItem._id.toString() === cartItem.productId);
            if (!product) {
                return null;
            }

            return {
                ...product,
                quantity: cartItem.quantity || 1,
                productId: cartItem.productId
            };
        })
        .filter(Boolean);
};

// get user cart by email
userApp.get('/cart/:email', verifyToken, asyncHandler(async (request, response) => {
    const emailInParams = request.params.email;
    const usersCollection = request.app.get('usersCollection');
    const userInDb = await usersCollection.findOne({ email: emailInParams });

    if (userInDb == null) {
        return response.status(404).send({ message: 'user not found, please check your credentials' });
    }

    const cartItems = await mapCartItems(request, userInDb.cartItems || []);
    response.status(200).send({ message: 'cart fetched successfully', payload: cartItems });
}))

// add item to cart
userApp.post('/cart/:email', verifyToken, asyncHandler(async (request, response) => {
    const emailInParams = request.params.email;
    const usersCollection = request.app.get('usersCollection');
    const productsCollection = request.app.get('productsCollection');
    const userInDb = await usersCollection.findOne({ email: emailInParams });

    if (userInDb == null) {
        return response.status(404).send({ message: 'user not found, please check your credentials' });
    }

    const requestedItems = Array.isArray(request.body.items)
        ? request.body.items
        : [{ productId: request.body.productId, quantity: request.body.quantity ?? 1 }];

    const normalizedItems = requestedItems
        .map((item) => ({
            productId: item?.productId,
            quantity: Math.max(Number(item?.quantity) || 0, 0)
        }))
        .filter((item) => Boolean(item.productId) && item.quantity > 0);

    if (normalizedItems.length === 0) {
        return response.status(400).send({ message: 'no cart items provided' });
    }

    const productObjectIds = [];
    const productIds = [];

    for (const item of normalizedItems) {
        productIds.push(item.productId);
        try {
            productObjectIds.push(new ObjectId(item.productId));
        } catch {
            // Not every product id in this app is guaranteed to be a Mongo ObjectId string.
        }
    }

    const productsFromDb = await productsCollection.find({
        $or: [
            { _id: { $in: productObjectIds } },
            { _id: { $in: productIds } }
        ]
    }).toArray();

    if (productsFromDb.length === 0) {
        return response.status(404).send({ message: 'one or more products not found' });
    }

    const currentCart = Array.isArray(userInDb.cartItems) ? userInDb.cartItems : [];
    const cartByProductId = new Map(currentCart.map((item) => [item.productId, { ...item }]));

    normalizedItems.forEach((item) => {
        const existingCartItem = cartByProductId.get(item.productId);

        if (existingCartItem) {
            existingCartItem.quantity += item.quantity;
            cartByProductId.set(item.productId, existingCartItem);
        } else {
            cartByProductId.set(item.productId, { productId: item.productId, quantity: item.quantity });
        }
    });

    const updatedCart = Array.from(cartByProductId.values());

    await usersCollection.updateOne(
        { email: emailInParams },
        { $set: { cartItems: updatedCart } }
    );

    const payload = await mapCartItems(request, updatedCart);
    response.status(200).send({ message: 'product added to cart', payload });
}))

// update cart item quantity
userApp.put('/cart/:email/:productId', verifyToken, asyncHandler(async (request, response) => {
    const { email: emailInParams, productId } = request.params;
    const usersCollection = request.app.get('usersCollection');
    const userInDb = await usersCollection.findOne({ email: emailInParams });

    if (userInDb == null) {
        return response.status(404).send({ message: 'user not found, please check your credentials' });
    }

    const quantity = Math.max(Number(request.body.quantity) || 0, 0);
    const currentCart = Array.isArray(userInDb.cartItems) ? userInDb.cartItems : [];
    const nextCart = currentCart
        .map((item) => (item.productId === productId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0);

    await usersCollection.updateOne(
        { email: emailInParams },
        { $set: { cartItems: nextCart } }
    );

    const payload = await mapCartItems(request, nextCart);
    response.status(200).send({ message: 'cart updated successfully', payload });
}))

// remove item from cart
userApp.delete('/cart/:email/:productId', verifyToken, asyncHandler(async (request, response) => {
    const { email: emailInParams, productId } = request.params;
    const usersCollection = request.app.get('usersCollection');
    const userInDb = await usersCollection.findOne({ email: emailInParams });

    if (userInDb == null) {
        return response.status(404).send({ message: 'user not found, please check your credentials' });
    }

    const currentCart = Array.isArray(userInDb.cartItems) ? userInDb.cartItems : [];
    const nextCart = currentCart.filter((item) => item.productId !== productId);

    await usersCollection.updateOne(
        { email: emailInParams },
        { $set: { cartItems: nextCart } }
    );

    const payload = await mapCartItems(request, nextCart);
    response.status(200).send({ message: 'product removed from cart', payload });
}))

// clear cart
userApp.delete('/cart/:email', verifyToken, asyncHandler(async (request, response) => {
    const emailInParams = request.params.email;
    const usersCollection = request.app.get('usersCollection');
    const userInDb = await usersCollection.findOne({ email: emailInParams });

    if (userInDb == null) {
        return response.status(404).send({ message: 'user not found, please check your credentials' });
    }

    await usersCollection.updateOne(
        { email: emailInParams },
        { $set: { cartItems: [] } }
    );

    response.status(200).send({ message: 'cart cleared successfully', payload: [] });
}))

userApp.put('/update-user/:email', verifyToken, multerObject.single('profile'), asyncHandler(async (request, response) => {
    const emailInParams = request.params.email;
    const usersCollection = request.app.get('usersCollection');
    const existingUser = await usersCollection.findOne({ email: emailInParams });

    if (existingUser == null) {
        return response.status(404).send({ message: 'user not found, please check your credentials' });
    }

    const incomingUser = request.body.user ? JSON.parse(request.body.user) : {};
    delete incomingUser.profilePicture;
    const mergedUser = {
        ...existingUser,
        ...incomingUser
    };

    delete mergedUser.profilePicture;

    if (incomingUser.password) {
        mergedUser.password = await bcrypt.hash(incomingUser.password, 5);
    } else {
        mergedUser.password = existingUser.password;
    }

    if (request.file?.path) {
        mergedUser.image = request.file.path;
    } else {
        mergedUser.image = existingUser.image;
    }

    delete mergedUser._id;

    await usersCollection.updateOne(
        { email: emailInParams },
        { $set: mergedUser }
    );

    const { password, _id, ...safeUser } = mergedUser;
    response.status(200).send({ message: 'profile updated successfully', payload: safeUser });
}))
// exporting the mini application
module.exports = userApp;