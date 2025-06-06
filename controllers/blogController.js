const Blog = require('../models/blogmodel');
const path = require('path');
const fs = require('fs');

// Create a new blog
exports.createBlog = async (req, res) => {
  try {
    const { title, tags } = req.body;
   
    let contentpath=null;
   
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
    const newBlog = new Blog({
      user_id: req.user._id,
      title,
      content:contentpath,
      tags,
      created_at: new Date(),
      updated_at: new Date()
    });

    const savedBlog = await newBlog.save();
    res.status(201).json(savedBlog);
  } catch (error) {
    console.error("Error in createBlog:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const pageNo = req.query.page || 1;

  // result per page
  const resultPerPage = req.query.limit || 6;
    const blogs = await Blog.find({}).populate('user_id').skip((pageNo - 1) * resultPerPage)
    .limit(resultPerPage);
    if (blogs.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No more blogs",
      });
    };
    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a specific blog by ID
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('user_id');
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a blog by ID
exports.updateBlog = async (req, res) => {
  try {
    const { title, user_id, tags } = req.body;
    let updateData = { title, user_id, tags, updated_at: new Date() };

    // Handle PDF file upload if present
    if (req.file) {
      updateData.content = req.file.path;
    }

    const blog = await Blog.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('user_id');
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a blog by ID
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.status(200).json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
