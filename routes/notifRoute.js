const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');


// Register or update notification token
router.post('/register-token',  notificationController.registerToken);

// Delete notification token

// Test sending notification
router.post('/test', notificationController.sendTestNotification);

module.exports = router;