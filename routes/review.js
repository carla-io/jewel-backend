const express = require('express');
const { addReview, getAllReviews, deleteReview, getReviewById, updateReview, getReviewsByProductId } = require('../controllers/reviewController');
const router = express.Router();

// Route to add a review
router.post('/add', addReview);
router.get('/get', getAllReviews);
router.delete('/delete/:id', deleteReview );
router.get('/getSingle/:productId/:userId', getReviewById);
router.put('/update', updateReview);
router.get('/:productId', getReviewsByProductId);

module.exports = router;    
