const Promotion = require('../models/promotion');
const NotificationToken = require('../models/notification');
const { Expo } = require('expo-server-sdk');

const expo = new Expo();

exports.createPromotion = async (req, res) => {
  try {
    const { title, description, discount, startDate, endDate } = req.body;

    const promo = new Promotion({
      title,
      description,
      discount,
      startDate,
      endDate,
    });
    await promo.save();

    const tokens = await NotificationToken.find({});
    const messages = tokens
      .filter(t => Expo.isExpoPushToken(t.expoPushToken))
      .map(token => ({
        to: token.expoPushToken,
        sound: 'default',
        title: '🔥 New Promotion!',
        body: `${title} - Save ${discount}%!`,
        data: { type: 'promotion', promoId: promo._id },
      }));

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (let chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Notification error:', error);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Promotion created and notifications sent',
      promotion: promo,
      tickets,
    });
  } catch (error) {
    console.error('Create promotion error:', error);
    res.status(500).json({ success: false, message: 'Failed to create promotion', error: error.message });
  }
};

exports.getPromotions = async (req, res) => {
  try {
    const promos = await Promotion.find({}).sort({ createdAt: -1 });
    res.status(200).json(promos);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch promotions', error: error.message });
  }
};