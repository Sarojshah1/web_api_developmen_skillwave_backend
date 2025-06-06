const ForumPost = require('../models/forumPost');
const User=require("../models/usersmodel")
const fs = require('fs');
const path = require('path');
// Create a new forum post
exports.createForumPost = async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    let imagePaths = [];
    if (req.files && req.files.images) {
      const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];

      for (const image of images) {
        const fileName = `forum_image-${Date.now()}-${image.name}`;
        const uploadPath = path.join(__dirname, `../public/uploads/forum/${fileName}`);
        const dir = path.dirname(uploadPath);

        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        await image.mv(uploadPath);
        imagePaths.push(`/uploads/forum/${fileName}`);
      }
    }

    const newForumPost = new ForumPost({
      user_id: req.user._id,
      title,
      content,
      tags,
      images: imagePaths,
      created_at: new Date(),
      updated_at: new Date()
    });

    const savedForumPost = await newForumPost.save();
    res.status(201).json(savedForumPost);
  } catch (error) {
    console.error("Error in createForumPost:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const shuffleArray = (array) => {
  return array.sort(() => Math.random() - 0.5);
};

exports.getAllForumPosts = async (req, res) => {
  try {
    const pageNo = parseInt(req.query.page) || 1;
    const resultPerPage = parseInt(req.query.limit) || 6;
    const userId=req.user._id;
    const userTags = req.user.search_history || [];
    const regexTags = userTags.map(tag => new RegExp(tag, 'i'));
    const recommendedPosts = await ForumPost.find({
        $or: [
    { title: { $in: regexTags } },
    { content: { $in: regexTags } },
    { tags: { $in: regexTags } }
  ]
    }).populate('user_id').populate({
      path: 'comments',
      populate: [
        { path: 'user_id', model: 'User' },
        { path: 'replies.user_id', model: 'User' }
      ],
    });

    // Fetch new posts
    const newPosts = await ForumPost.find({})
      .sort({ created_at: -1 })
      .populate('user_id').populate({
        path: 'comments',
        populate: [
          { path: 'user_id', model: 'User' },
          { path: 'replies.user_id', model: 'User' }
        ],
      });

    // Fetch random posts
    const randomPosts = shuffleArray(await ForumPost.find({})
      .populate('user_id').populate({
        path: 'comments',
        populate: [
          { path: 'user_id', model: 'User' },
          { path: 'replies.user_id', model: 'User' }
        ],
      }));

    const allCombined = [
      ...recommendedPosts,
      ...newPosts,
      ...randomPosts
    ];

    const uniquePostMap = new Map();
    allCombined.forEach(post => {
      uniquePostMap.set(post._id.toString(), post);
    });

    const uniquePosts = Array.from(uniquePostMap.values());

    const paginatedPosts = uniquePosts.slice((pageNo - 1) * resultPerPage, pageNo * resultPerPage);

    if (paginatedPosts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No more Posts",
      });
    }

    res.status(200).json(paginatedPosts);

  } catch (error) {
    console.error("Error in getAllForumPosts:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Get a specific forum post by ID
exports.getForumPostById = async (req, res) => {
  try {
    const forumPost = await ForumPost.findById(req.params.id).populate('user_id').populate({
      path: 'comments',
      populate: [
        { path: 'user_id', model: 'User' }, 
        {
          path: 'replies.user_id', 
          model: 'User',
        },
      ],
    });
    if (!forumPost) {
      return res.status(404).json({ message: 'Forum post not found' });
    }
    res.status(200).json(forumPost);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a forum post by ID
exports.updateForumPost = async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    let updateData = { title, content, tags, updated_at: new Date() };

    const forumPost = await ForumPost.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('user_id');
    if (!forumPost) {
      return res.status(404).json({ message: 'Forum post not found' });
    }

    res.status(200).json(forumPost);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a forum post by ID
exports.deleteForumPost = async (req, res) => {
  try {
    const forumPost = await ForumPost.findByIdAndDelete(req.params.id);
    if (!forumPost) {
      return res.status(404).json({ message: 'Forum post not found' });
    }
    res.status(200).json({ message: 'Forum post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add a comment to a forum post
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const forumPost = await ForumPost.findById(req.params.id);
    console.log(req.body);

    if (!forumPost) {
      return res.status(404).json({ message: 'Forum post not found' });
    }

    const newComment = {
      user_id: req.user._id,
      content,
      created_at: new Date(),
    };

    forumPost.comments.push(newComment);
    const updatedForumPost = await forumPost.save();
    
    // Use findById again to populate after saving
    const populatedForumPost = await ForumPost.findById(updatedForumPost._id).populate('user_id')
      .populate({
        path: 'comments',
        populate: [
          { path: 'user_id', model: 'User' },
          {
            path: 'replies',
            populate: { path: 'user_id', model: 'User' },
          },
        ],
      })
      .exec();

      // global.io.emit('new-comment', { postId: req.params.id, post: populatedForumPost });
    res.status(200).json(populatedForumPost);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add a reply to a comment
exports.addReply = async (req, res) => {
  try {
    const { content } = req.body;
    const forumPost = await ForumPost.findById(req.params.postId);

    if (!forumPost) {
      return res.status(404).json({ message: 'Forum post not found' });
    }

    const comment = forumPost.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const newReply = {
      user_id: req.user._id,
      content,
      created_at: new Date(),
    };

    comment.replies.push(newReply);
    const updatedForumPost = await forumPost.save();
    const populatedForumPost = await ForumPost.findById(updatedForumPost._id).populate('user_id')
      .populate({
        path: 'comments',
        populate: [
          { path: 'user_id', model: 'User' },
          {
            path: 'replies',
            populate: { path: 'user_id', model: 'User' },
          },
        ],
      })
      .exec();
      global.io.emit('new-reply', { postId: req.params.postId, post: populatedForumPost });
    res.status(200).json(populatedForumPost);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add a like to a forum post
exports.addLike = async (req, res) => {
  try {
    console.log(req.user._id)
    const forumPost = await ForumPost.findById(req.params.id);

    if (!forumPost) {
      return res.status(404).json({ message: 'Forum post not found' });
    }

    if (forumPost.likes.includes(req.user._id)) {
      return res.status(400).json({ message: 'User has already liked this post' });
    }

    forumPost.likes.push(req.user._id);

    const updatedForumPost = await forumPost.save();

    const populatedForumPost = await ForumPost.findById(updatedForumPost._id).populate('user_id')
      .populate({
        path: 'comments',
        populate: [
          { path: 'user_id', model: 'User' },
          {
            path: 'replies',
            populate: { path: 'user_id', model: 'User' },
          },
        ],
      })
      .exec();

    res.status(200).json(populatedForumPost);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const forumPost = await ForumPost.findById(req.params.id)
      .select('comments') 
      .populate({
        path: 'comments',
        populate: [
          { path: 'user_id', model: 'User' }, 
          {
            path: 'replies',
            populate: { path: 'user_id', model: 'User'}, 
          },
        ],
      });

    if (!forumPost) {
      return res.status(404).json({ message: 'Forum post not found' });
    }

    res.status(200).json(forumPost.comments);
  } catch (error) {
    console.error("Error in getComments:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
