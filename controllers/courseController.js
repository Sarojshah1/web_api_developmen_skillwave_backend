const Course = require('../models/coursemodel');
const fs = require('fs');
const path = require('path');
const { verifyToken } = require('../middlewares/authMiddleware');
const mongoose = require('mongoose');
// Create a new course
exports.createCourse = async (req, res) => {
  try {
    const { title, description, category_id, price, duration, level, lessons, quizzes, reviews, certificates } = req.body;
    console.log("Request body:", req.body); // Log the request body for debugging
    console.log("Request files:", req.files); // Log the request files for debugging

    let thumbnailPath = null;

  
    if (req.files && req.files.thumbnail) {
      const { thumbnail } = req.files;
      thumbnailPath = `thumbnail-${Date.now()}-${thumbnail.name}`;
      const uploadPath = path.join(__dirname, `../public/thumbnails/${thumbnailPath}`);
      
      // Create directory if it doesn't exist
      const directoryPath = path.join(__dirname, '../public/thumbnails');
      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }

      await thumbnail.mv(uploadPath);
    }

    const course = new Course({
      title,
      description,
      created_by:req.user._id,
      category_id,
      price,
      duration,
      level,
      thumbnail: thumbnailPath, 
      lessons,
      quizzes,
      reviews,
      certificates
    });

    await course.save();
    res.status(201).json(course);
  } catch (error) {
    console.error("Error in createCourse:", error); // Log error to the console
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a course by ID
exports.updateCourse = async (req, res) => {
  try {
    const { title, description, created_by, category_id, price, duration, level, lessons, quizzes, reviews, certificates } = req.body;
    
    let updateData = { title, description, created_by, category_id, price, duration, level, lessons, quizzes, reviews, certificates };

    // Handle thumbnail file upload if present
    if (req.files && req.files.thumbnail) {
      const { thumbnail } = req.files;
      const thumbnailPath = `thumbnail-${Date.now()}-${thumbnail.name}`;
      const uploadPath = path.join(__dirname, `../public/thumbnails/${thumbnailPath}`);

      // Create directory if it doesn't exist
      const directoryPath = path.join(__dirname, '../public/thumbnails');
      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }

      await thumbnail.mv(uploadPath);
      updateData.thumbnail = thumbnailPath; // Save the new path to the database
    }

    const course = await Course.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('created_by')
      .populate('category_id')
      .populate('lessons')
      .populate('quizzes')
      .populate('reviews')
      .populate('certificates');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json(course);
  } catch (error) {
    console.error("Error in updateCourse:", error); // Log error to the console
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all courses
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('created_by').populate('category_id');
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get a specific course by ID
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('created_by')
      .populate('category_id')
      .populate('lessons')
      .populate('quizzes');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete a course by ID
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getCoursesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const courses = await Course.find({ category_id: categoryId })
      .populate('created_by')
      .populate('category_id');
      
    if (courses.length === 0) {
      return res.status(404).json({ message: 'No courses found for this category' });
    }

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get courses by the creator (user)
exports.getCoursesByCreator = async (req, res) => {
  try {
    const { userId } = req.params;
    const courses = await Course.find({ created_by: userId })
      .populate('created_by')
      .populate('category_id')
      .populate('lessons')
      .populate('quizzes')
      .populate('reviews')
      .populate('certificates');

  

    res.status(200).json(courses);
  } catch (error) {
    console.error("Error in getCoursesByCreator:", error); // Log error to the console
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPaginationCourses = async (req, res) => {
  try {
    const pageNo = parseInt(req.query.page) || 1;
    const resultPerPage = parseInt(req.query.limit) || 6;

    // Get total courses count
    const totalCourses = await Course.countDocuments({});

    // Calculate total pages
    const totalPages = Math.ceil(totalCourses / resultPerPage);

    // Fetch courses with pagination
    const courses = await Course.find({})
      .populate('created_by')
      .populate('category_id')
      .populate('lessons')
      .populate('quizzes')
      .skip((pageNo - 1) * resultPerPage)
      .limit(resultPerPage);

    if (courses.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No more Courses",
      });
    }

    res.status(200).json({
      success: true,
      page: pageNo,
      totalPages,
      totalCourses,
      count: courses.length,
      courses,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
