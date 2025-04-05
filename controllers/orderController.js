const mongoose = require('mongoose');
const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');
const { Expo } = require('expo-server-sdk');
const NotificationToken = require('../models/notification'); // Import our new model

// Initialize Expo SDK
const expo = new Expo();

exports.createOrder = async (req, res) => {
    try {
        console.log("Request Body:", req.body);

        const { userId, orderItems, shippingInfo, itemsPrice, taxPrice, shippingPrice, totalPrice, modeOfPayment } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        const newOrder = new Order({
            user: userId,
            orderItems,
            shippingInfo,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            modeOfPayment,
            orderStatus: "Processing",
        });
        
        await newOrder.save();
        
        // Send order confirmation notification
        await sendOrderNotification(
            userId, 
            newOrder._id,
            "Order Received", 
            `Your order #${newOrder._id} has been received and is being processed.`,
            { orderId: newOrder._id, status: "Processing" }
        );

        return res.status(201).json({ success: true, message: "Order placed successfully!", order: newOrder });
    } catch (error) {
        console.error("Order creation failed:", error);
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('orderItems.product')   
            .populate('user', 'name email');
        
        // Transform orders to handle missing user references
        const safeOrders = orders.map(order => {
            const orderObj = order.toObject();
            
            // If user is not populated or missing, provide a fallback
            if (!orderObj.user) {
                orderObj.user = {
                    _id: 'unknown',
                    name: 'Unknown User',
                    email: 'unknown@email.com'
                };
            }
            
            return orderObj;
        });

        if (!safeOrders || safeOrders.length === 0) {
            return res.status(404).json({ message: 'No orders found.' });
        }

        console.log('Processed Orders:', safeOrders);
        res.status(200).json({ orders: safeOrders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!['Processing', 'Delivered', 'Cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value.' });
    }

    try {
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId, 
            { orderStatus: status }, 
            { new: true }
        ).populate('user');

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        // Get notification title and body based on status
        const notificationContent = getStatusNotificationContent(status, orderId);
        
        // 1. Send notification to the customer (order owner)
        if (updatedOrder.user && updatedOrder.user._id) {
            try {
                await sendOrderNotification(
                    updatedOrder.user._id.toString(),
                    orderId,
                    notificationContent.title,
                    notificationContent.body,
                    { 
                        orderId, 
                        status,
                        screen: 'OrderDetails',
                        params: { orderId }
                    }
                );
            } catch (notifError) {
                console.error("Failed to send customer notification:", notifError);
                // Continue execution even if notification fails
            }
        }
        
        // 2. Also send a confirmation to the admin who made the update
        // This is optional but useful for confirming action was successful
        const adminId = req.body.adminId; // You'll need to send this from frontend
        if (adminId) {
            try {
                await sendOrderNotification(
                    adminId,
                    orderId,
                    `Order ${orderId} Updated`,
                    `You successfully updated order to ${status}`,
                    { 
                        orderId, 
                        status,
                        screen: 'AdminOrders',
                    }
                );
            } catch (adminNotifError) {
                console.error("Failed to send admin notification:", adminNotifError);
                // Continue execution even if notification fails
            }
        }

        res.status(200).json({ 
            success: true,
            message: 'Order status updated successfully.', 
            order: updatedOrder 
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error',
            error: error.message 
        });
    }
};

exports.deleteOrder = async (req, res) => {
    const { orderId } = req.params;

    try {
        const deletedOrder = await Order.findByIdAndDelete(orderId);

        if (!deletedOrder) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        res.status(200).json({ message: 'Order deleted successfully.' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getMonthlySales = async (req, res) => {
    try {
        const salesData = await Order.aggregate([
            {
                $match: {
                    status: 'Completed',
                }
            },
            {
                $group: {
                    _id: { 
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    totalSales: { $sum: "$totalPrice" }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);

        if (!salesData || salesData.length === 0) {
            return res.status(404).json({ message: 'No sales data found.' });
        }

        res.status(200).json({ salesData });
    } catch (error) {
        console.error('Error fetching monthly sales data:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.params.userId;

        const orders = await Order.find({ user: userId })
            .populate('orderItems.product')
            .populate('user', 'name email');

        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: 'No orders found for this user.' });
        }

        res.status(200).json({ orders });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Helper function to get notification content based on order status
function getStatusNotificationContent(status, orderId) {
    switch (status) {
        case 'Processing':
            return {
                title: 'Order Processing',
                body: `Your order #${orderId} is being processed.`
            };
        case 'Delivered':
            return {
                title: 'Order Delivered',
                body: `Your order #${orderId} has been delivered!`
            };
        case 'Cancelled':
            return {
                title: 'Order Cancelled',
                body: `Your order #${orderId} has been cancelled.`
            };
        default:
            return {
                title: 'Order Status Update',
                body: `Your order #${orderId} status has been updated to ${status}.`
            };
    }
}

// Helper function to send push notifications to a user's devices
async function sendOrderNotification(userId, orderId, title, body, data = {}) {
    try {
        // Find all notification tokens for this user
        const tokens = await NotificationToken.find({ userId });
        
        if (!tokens || tokens.length === 0) {
            console.log(`No notification tokens found for user ${userId}`);
            return;
        }
        
        // Create notification messages for each token
        const messages = tokens.map(token => {
            // Validate that the token is in the correct format
            if (!Expo.isExpoPushToken(token.expoPushToken)) {
                console.error(`Invalid Expo push token: ${token.expoPushToken}`);
                return null;
            }
            
            // Create message object
            return {
                to: token.expoPushToken,
                sound: 'default',
                title,
                body,
                data: {
                    ...data,
                    timestamp: new Date().toISOString()
                }
            };
        }).filter(Boolean); // Remove any null entries
        
        if (messages.length === 0) {
            console.log('No valid tokens to send notifications to');
            return;
        }
        
        // Chunk the messages (Expo limitation)
        const chunks = expo.chunkPushNotifications(messages);
        
        // Send the chunks
        const tickets = [];
        for (let chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
                console.log('Push notification sent:', ticketChunk);
            } catch (error) {
                console.error('Error sending push notification chunk:', error);
            }
        }
        
        // Handle tickets (optional, but recommended for production)
        handlePushNotificationReceipts(tickets);
        
        return tickets;
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
}

// Helper function to check notification receipts
async function handlePushNotificationReceipts(tickets) {
    // After some time, check which notifications were actually delivered
    const receiptIds = tickets
        .filter(ticket => ticket.id) // Filter out tickets with no ID
        .map(ticket => ticket.id);
    
    if (receiptIds.length === 0) {
        return;
    }
    
    // Delay checking for receipts to allow time for delivery
    setTimeout(async () => {
        try {
            const receiptChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
            
            for (let chunk of receiptChunks) {
                try {
                    const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
                    
                    // Process receipts and handle errors
                    for (let [id, receipt] of Object.entries(receipts)) {
                        if (receipt.status === 'error') {
                            console.error(`Error delivering notification with ID ${id}:`, receipt.message);
                            
                            // If the error is due to an unregistered device, remove the token
                            if (receipt.details && receipt.details.error === 'DeviceNotRegistered') {
                                await NotificationToken.deleteMany({ expoPushToken: receipt.message });
                                console.log('Removed invalid token from database');
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error checking receipts:', error);
                }
            }
        } catch (error) {
            console.error('Error checking notification receipts:', error);
        }
    }, 5000); // Check after 5 seconds
}