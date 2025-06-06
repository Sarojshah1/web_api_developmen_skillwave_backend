const Question = require('../models/questionmodel');
const Quiz = require('../models/quizmodel');

// Create a new question
exports.createQuestion = async (req, res) => {
  try {
    const { quiz_id, question_text, question_type, options, correct_answer } = req.body;
    
    const newQuestion = new Question({
      quiz_id,
      question_text,
      question_type,
      options,
      correct_answer
    });

    const savedQuestion = await newQuestion.save();
    await Quiz.findByIdAndUpdate(
        quiz_id,
        { $push: { questions: savedQuestion._id } },
        { new: true }
      );
    res.status(201).json(savedQuestion);
  } catch (error) {
    console.error("Error in createQuestion:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all questions
exports.getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find().populate('quiz_id');
    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a specific question by ID
exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate('quiz_id');
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.status(200).json(question);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a question by ID
exports.updateQuestion = async (req, res) => {
  try {
    const { question_text, question_type, options, correct_answer } = req.body;
    const updateData = { 
      question_text, 
      question_type, 
      options, 
      correct_answer 
    };

    const question = await Question.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('quiz_id');

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    

    res.status(200).json(question);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a question by ID
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    await Quiz.findByIdAndUpdate(
        question.quiz_id,
        { $pull: { questions: question._id } },
        { new: true }
      );
    
    res.status(200).json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
