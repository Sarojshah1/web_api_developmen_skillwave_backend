const UserQuizResult = require('../models/quizresultmodel');
const mongoose = require('mongoose');
const User = require('../models/usersmodel');
// Create a new user quiz result
exports.createUserQuizResult = async (req, res) => {
  try {
    const { quiz_id } = req.body;
    let { score } = req.body;
    score = Math.floor(score);
    const status = score >= 70 ? 'passed' : 'failed';
    const user_id = req.user._id;

    
    // Create a new quiz result
    const userQuizResult = new UserQuizResult({
      user_id,
      quiz_id,
      score,
      status
    });

    const savedResult = await userQuizResult.save();
    await User.findByIdAndUpdate(user_id, {
        $push: { quiz_results: savedResult._id }
      });
    res.status(201).json(savedResult);
  } catch (error) {
    console.error("Error in createUserQuizResult:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all user quiz results
exports.getAllUserQuizResults = async (req, res) => {
  try {
    const results = await UserQuizResult.find()
      .populate('user_id')
      .populate('quiz_id');
    res.status(200).json(results);
  } catch (error) {
    console.error("Error in getAllUserQuizResults:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a specific user quiz result by ID
exports.getUserQuizResultById = async (req, res) => {
  try {
    const result = await UserQuizResult.findById(req.params.id)
      .populate('user_id')
      .populate('quiz_id');
    if (!result) {
      return res.status(404).json({ message: 'User quiz result not found' });
    }
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getUserQuizResultById:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a user quiz result by ID
exports.updateUserQuizResult = async (req, res) => {
  try {
    const { score, status } = req.body;
    const updateData = { score, status };

    const result = await UserQuizResult.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('user_id')
      .populate('quiz_id');
    if (!result) {
      return res.status(404).json({ message: 'User quiz result not found' });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in updateUserQuizResult:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a user quiz result by ID
exports.deleteUserQuizResult = async (req, res) => {
  try {
    const result = await UserQuizResult.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'User quiz result not found' });
    }
    res.status(200).json({ message: 'User quiz result deleted successfully' });
  } catch (error) {
    console.error("Error in deleteUserQuizResult:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
