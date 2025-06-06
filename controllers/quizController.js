const Quiz = require('../models/quizmodel');
const Course = require('../models/coursemodel');

// Create a new quiz
exports.createQuiz = async (req, res) => {
  try {
    const { course_id, title, description, total_marks, passing_marks } = req.body;
    
    const newQuiz = new Quiz({
      course_id,
      title,
      description,
      total_marks,
      passing_marks,
      created_at: new Date()
    });

    const savedQuiz = await newQuiz.save();
    await Course.findByIdAndUpdate(
      course_id,
      { $push: { quizzes: savedQuiz._id } },
      { new: true }
    );
    res.status(201).json(savedQuiz);
  } catch (error) {
    console.error("Error in createQuiz:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all quizzes
exports.getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find().populate('course_id').populate('questions');
    res.status(200).json(quizzes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a specific quiz by ID
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('course_id').populate('questions');
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    res.status(200).json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a quiz by ID
exports.updateQuiz = async (req, res) => {
  try {
    const { title, description, total_marks, passing_marks, questions } = req.body;
    const updateData = { 
      title, 
      description, 
      total_marks, 
      passing_marks, 
      questions, 
      updated_at: new Date() 
    };

    const quiz = await Quiz.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('course_id')
      .populate('questions');
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.status(200).json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a quiz by ID
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    res.status(200).json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
