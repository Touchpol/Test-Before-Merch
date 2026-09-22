const express = require('express');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const { authUser } = require('../middleware/auth');
const { validateReview } = require('../middleware/validate');

const router = express.Router();

/**
 * GET /api/reviews/product/:productId
 * ดึงรีวิวทั้งหมดของสินค้าชิ้นหนึ่ง
 */
router.get('/product/:productId', async (req, res, next) => {
  try {
    const { productId } = req.params;
    let query = {};

    if (mongoose.Types.ObjectId.isValid(productId)) {
      query.productId = productId;
    }

    const reviews = await Review.find(query)
      .populate('userId', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 });

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

    return res.json({
      success: true,
      count: reviews.length,
      averageRating: Number(averageRating),
      data: reviews,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/reviews
 * เพิ่มรีวิวสินค้าใหม่ (ต้องล็อกอิน)
 */
router.post('/', authUser, validateReview, async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;

    const review = await Review.create({
      userId: req.user._id,
      productId,
      rating,
      comment,
    });

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
