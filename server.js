const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const dotenv = require("dotenv").config();
const app = express();
const products = require('./routes/productRoute');
const user = require('./routes/authRoutes');
const order =  require('./routes/order');
const review = require('./routes/review');
const notificationRoutes = require('./routes/notifRoute');

app.use(cors());
app.use(express.json());

connectDB();

const PORT = process.env.PORT || 4000;

app.listen(4000, "0.0.0.0", () => {
    console.log("Server running on port 4000");
  });

app.use('/api/product', products);
app.use('/api/auth', user);
app.use('/api/order', order);
app.use('/api/reviews', review);
app.use('/api/notifications', notificationRoutes);

