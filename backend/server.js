// creating server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
// loading .env file
require('dotenv').config();

// creating app
const app = express();
app.disable('x-powered-by');

// hardening and request handling
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// allowing cors to access specific port
const origin = process.env.ORIGIN;
app.use(cors({
    origin: origin,
    credentials: true
}));

app.get('/health', (request, response) => {
    response.status(200).send({ message: 'ok' });
});

// importing Api's
const userApi = require('./Apis/userApi');
const productsApi = require('./Apis/productsApi');
const paymentApi = require('./Apis/paymentApi');

// available apis
app.use('/user-api', userApi);
app.use('/products-api', productsApi);
app.use('/payment-api', paymentApi);

// handling invalid path
app.use('*', (request, response) => {
    response.status(404).send({ message: 'invalid path request' });
});

// handling errors in api
app.use((error, request, response, next) => {
    response.status(error.status || 500).send({ message: error.message || 'error occured in api' });
});

// creating data base connnection
const mongoClient = require('mongodb').MongoClient;

// connecting to database
const mongoUrl = process.env.MONGO_DB_URL;
mongoClient.connect(mongoUrl)
.then(dbref => {
    const db = dbref.db('usersdb');
    const usersCollection = db.collection('usersCollection');
    const productsCollection = db.collection('productsCollection');
    app.set('usersCollection', usersCollection);
    app.set('productsCollection', productsCollection);

    const port = process.env.PORT || 5000;
    app.listen(port, () => {
        console.log(`server is listening on ${port} port number`);
    });

    console.log('database connected succesfully');
})
.catch(error => {
    console.log('error occured in database connection', error);
    process.exit(1);
});