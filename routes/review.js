const express = require('express');
const { addReview, getAllReviews, deleteReview, getReviewById, updateReview } = require('../controllers/reviewController');
const router = express.Router();

// Route to add a review
router.post('/add', addReview);
router.get('/get', getAllReviews);
router.delete('/delete/:id', deleteReview );
router.get('/getSingle/:productId/:userId', getReviewById);
router.put('/update', updateReview);


module.exports = router;    
