const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');

router.post('/save', promotionController.createPromotion);
router.get('/get', promotionController.getPromotions);

module.exports = router;