const Review = require('../models/reviews');
const Product = require('../models/product');

exports.addReview = async (req, res) => {
    try {
        const { userId, username, productId, rating, comment } = req.body;
        console.log('Received data:', { userId, username, productId, comment, rating });

        // Validate inputs
        if (!userId || !username || !productId || !rating || !comment) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required.',
            });
        }

        // Validate rating is between 1 and 10
        if (rating < 1 || rating > 10) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 10.',
            });
        }

        // Check if the product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found.',
            });
        }

        // Check if the user has already reviewed the product
        const existingReview = await Review.findOne({ userId, productId });
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this product.',
            });
        }

        // Create a new review
        const review = new Review({
            userId,
            username,
            productId,
            rating,
            comment,
        });

        // Save the review to the database
        await review.save();

        return res.status(201).json({
            success: true,
            message: 'Review added successfully.',
            review,
        });
    } catch (error) {
        console.error('Error adding review:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error, could not add review.',
        });
    }
};


exports.getAllReviews = async (req, res) => {
    try {
      const { productId } = req.query;
      
      let query = {};
      if (productId) {
        query.productId = productId;
      }
      
      const reviews = await Review.find(query)
        .populate('userId', 'name image')
        .sort({ createdAt: -1 });
        
      return res.status(200).json({
        success: true,
        reviews
      });
    } catch (error) {
      console.error('Error fetching reviews:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Server error, could not fetch reviews.'
      });
    }
  };

exports.deleteReview = async (req, res) => {
    try {
        const reviewId = req.params.id;
        
        // Find and delete the review
        const review = await Review.findByIdAndDelete(reviewId);
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found.',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Review deleted successfully.',
        });
    } catch (error) {
        console.error('Error deleting review:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error, could not delete review.',
        });
    }
};

exports.getReviewById = async (req, res) => {
    try {
        const { productId, userId } = req.params;

        if (!productId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID and User ID are required.',
            });
        }

        console.log('Received parameters:', { productId, userId });

        // Find the review based on productId and userId
        const review = await Review.findOne({ productId, userId })
            .populate('productId', 'name');

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'No review found for this product by this user.',
            });
        }

        return res.status(200).json({
            success: true,
            review,
        });
    } catch (error) {
        console.error('Error fetching review:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error, could not fetch review.',
        });
    }
};



// Update a review
exports.updateReview = async (req, res) => {
    try {
        const { userId, username, productId, rating, comment } = req.body;
        console.log('Received data:', { userId, username, productId, comment, rating });

        // Validate inputs
        if (!userId || !username || !productId || !rating || !comment) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required.',
            });
        }

        // Validate rating is between 1 and 10
        if (rating < 1 || rating > 10) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 10.',
            });
        }

        // Check if the product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found.',
            });
        }

        // Check if the user has already reviewed the product
        const existingReview = await Review.findOne({ userId, productId });

        if (existingReview) {
            // Update existing review
            existingReview.rating = rating;
            existingReview.comment = comment;
            await existingReview.save();
            return res.status(200).json({
                success: true,
                message: 'Review updated successfully.',
                review: existingReview,
            });
        } else {
            // Create a new review
            const review = new Review({
                userId,
                username,
                productId,
                rating,
                comment,
            });

            // Save the review to the database
            await review.save();

            return res.status(201).json({
                success: true,
                message: 'Review added successfully.',
                review,
            });
        }
    } catch (error) {
        console.error('Error adding or updating review:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error, could not add or update review.',
        });
    }
};

exports.getReviewsByProductId = async (req, res) => {
    try {
      const { productId } = req.params;
      
      if (!productId) {
        return res.status(400).json({
          success: false,
          message: 'Product ID is required.'
        });
      }
      
      const reviews = await Review.find({ productId })
        .populate('userId', 'name image') // Assuming you want user details
        .sort({ createdAt: -1 }); // Most recent first
        
      return res.status(200).json({
        success: true,
        reviews
      });
    } catch (error) {
      console.error('Error fetching reviews by product:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Server error, could not fetch reviews.'
      });
    }
  };
