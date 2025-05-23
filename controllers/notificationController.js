const NotificationToken = require('../models/notification');
const { Expo } = require('expo-server-sdk');
const mongoose = require('mongoose');

// Initialize Expo SDK
const expo = new Expo();

exports.registerToken = async (req, res) => {
    try {
        const { expoPushToken, userId, deviceInfo } = req.body;
        const lastUsed = new Date();
    
        console.log('Registering token with data:', { expoPushToken, userId, deviceInfo, lastUsed });
    
        let existingToken = await NotificationToken.findOne({ expoPushToken });
    
        if (existingToken) {
          existingToken.userId = userId || existingToken.userId;
          existingToken.deviceInfo = deviceInfo;
          existingToken.lastUsed = lastUsed;
          await existingToken.save();
        } else {
          await NotificationToken.create({
            expoPushToken,
            userId,
            deviceInfo,
            lastUsed
          });
        }
    
        res.status(200).json({ success: true, message: 'Push token registered' });
      } catch (error) {
        console.error('Error registering push token:', error);
        res.status(500).json({ success: false, message: 'Failed to register token' });
      }
};

exports.sendTestNotification = async (req, res) => {
    try {
        const { title, body, userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        // First try with direct userId comparison (whether it's ObjectId or string)
        let tokens = await NotificationToken.find({ userId });
        
        // If no tokens found and userId is valid ObjectId format, try with ObjectId conversion
        if ((!tokens || tokens.length === 0) && mongoose.Types.ObjectId.isValid(userId)) {
            const userObjectId = new mongoose.Types.ObjectId(userId);
            tokens = await NotificationToken.find({ userId: userObjectId });
        }
        
        // If still no tokens, try with string comparison
        if (!tokens || tokens.length === 0) {
            tokens = await NotificationToken.find({
                $expr: { $eq: [{ $toString: "$userId" }, userId] }
            });
        }
        
        // If still no tokens found
        if (!tokens || tokens.length === 0) {
            // Add comprehensive debugging
            const allTokens = await NotificationToken.find({});
            console.log('Debug - All tokens in system:', JSON.stringify(allTokens, null, 2));
            console.log('Debug - Looking for userId:', userId);
            
            return res.status(404).json({
                success: false,
                message: `No notification tokens found for user ${userId}`
            });
        }
        
        // Create messages
        const messages = tokens.map(token => ({
            to: token.expoPushToken,
            sound: 'default',
            title: title || 'Test Notification',
            body: body || 'This is a test notification',
            data: { type: 'test', timestamp: new Date().toISOString() }
        }));
        
        // Send notifications
        const tickets = [];
        const chunks = expo.chunkPushNotifications(messages);
        
        for (let chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('Error sending test notification chunk:', error);
            }
        }
        
        res.status(200).json({
            success: true,
            message: `Test notifications sent to ${tokens.length} devices`,
            tickets
        });
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test notification',
            error: error.message
        });
    }
};

// Add this new debug endpoint
exports.debugTokens = async (req, res) => {
    try {
        const allTokens = await NotificationToken.find({});
        
        const tokenDetails = allTokens.map(token => ({
            id: token._id.toString(),
            expoPushToken: token.expoPushToken,
            userId: token.userId ? token.userId.toString() : null,
            userIdType: token.userId ? (typeof token.userId === 'object' ? 'ObjectId' : typeof token.userId) : null,
            deviceInfo: token.deviceInfo,
            lastUsed: token.lastUsed
        }));
        
        res.status(200).json({
            count: tokenDetails.length,
            tokens: tokenDetails
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};