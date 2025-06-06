const Lesson = require('../models/lessonmodel');
const path = require('path');
const fs = require('fs');
const Course=require('../models/coursemodel');
// Create a new lesson
exports.createLesson = async (req, res) => {
  try {
    const { course_id, title, video_url, order } = req.body;
    let contentpath=null;
   
    console.log('File:', req.file);
    if (req.files && req.files.content) {
      const { content } = req.files;
      contentpath = `thumbnail-${Date.now()}-${content.name}`;
      const uploadPath = path.join(__dirname, `../public/uploads/pdfs/${contentpath}`);
      
      // Create directory if it doesn't exist
      const directoryPath = path.join(__dirname, '../public/uploads/pdfs');
      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }

      await content.mv(uploadPath);
    }
    
    const newLesson = new Lesson({
      course_id,
      title,
      content:contentpath,
      video_url,
      order
    });

    const savedLesson = await newLesson.save();
    await Course.findByIdAndUpdate(
        course_id,
        { $push: { lessons: savedLesson._id } },
        { new: true }
      );
    res.status(201).json(savedLesson);
  } catch (error) {
    console.error("Error in createLesson:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all lessons
exports.getAllLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find().populate('course_id');
    res.status(200).json(lessons);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a specific lesson by ID
exports.getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('course_id');
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    res.status(200).json(lesson);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a lesson by ID
exports.updateLesson = async (req, res) => {
  try {
    const { title, content, video_url, order } = req.body;
    const updateData = { title, content, video_url, order };

    const lesson = await Lesson.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('course_id');
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    res.status(200).json(lesson);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a lesson by ID
exports.deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    res.status(200).json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
