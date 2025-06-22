const Review = require('../models/review');

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const { course_id, rating, comment } = req.body;
    const user_id = req.user._id;

    const newReview = new Review({
      user_id,
      course_id,
      rating,
      comment,
      created_at: new Date()
    });

    const savedReview = await newReview.save();
    const populatedreview = await Review.findById(savedReview._id).populate('user_id');
    ;
    res.status(201).json(populatedreview);
  } catch (error) {
    console.error("Error in createReview:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().populate('user_id').populate('course_id');
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a specific review by ID
exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate('user_id').populate('course_id');
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.status(200).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a review by ID
exports.updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const updateData = { rating, comment, updated_at: new Date() };

    const review = await Review.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('user_id').populate('course_id');
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.status(200).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a review by ID
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getReviewsByCourseId = async (req, res) => {
  try {
    const reviews = await Review.find({ course_id: req.params.courseId }).populate('user_id');
    if (reviews.length === 0) {
      return res.status(200).json({ reviews});
    }
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};