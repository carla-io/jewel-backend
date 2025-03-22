const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },  // Correct: "user" not "userId"
    orderItems: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
            name: String,
            quantity: Number,
            image: String,
            price: Number,
        }
    ],
    shippingInfo: {
        address: String,
        city: String,
        phoneNo: String,
        postalCode: String,
        country: String
    },
    itemsPrice: Number,
    taxPrice: Number,
    shippingPrice: Number,
    totalPrice: Number,
    modeOfPayment: String,
    orderStatus: { type: String, default: "Processing" }
});


module.exports = mongoose.model('Order', OrderSchema);
