const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  discount: { type: Number, required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Promotion', promotionSchema);