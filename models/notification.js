const mongoose = require('mongoose');


const notificationTokenSchema = new mongoose.Schema({
  expoPushToken: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Making this optional
  },
  deviceInfo: {
    platform: String,
    model: String,
    osVersion: String
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('NotificationToken', notificationTokenSchema);