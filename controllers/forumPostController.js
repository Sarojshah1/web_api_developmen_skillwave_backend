const ForumPost = require('../models/forumPost');
const User=require("../models/usersmodel")
const fs = require('fs');
const path = require('path');
// Create a new forum post
exports.createForumPost = async (req, res) => {
  try {
    const { title, content, tags, category } = req.body;
    console.log(req.body)
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
      category: category || "general",
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

// Enhanced getAllForumPosts with recommendation system
exports.getAllForumPosts = async (req, res) => {
  try {
    const pageNo = parseInt(req.query.page) || 1;
    const resultPerPage = parseInt(req.query.limit) || 6;
    const userId = req.user._id;
    const userTags = req.user.search_history || [];
    const allTags = [...userTags];
    
    // 1. Content-based filtering (based on user's search history and interests)
    const contentBasedPosts = await ForumPost.find({
      $or: [
        { title: { $in: allTags.map(tag => new RegExp(tag, 'i')) } },
        { content: { $in: allTags.map(tag => new RegExp(tag, 'i')) } },
        { tags: { $in: allTags.map(tag => new RegExp(tag, 'i')) } }
      ]
    }).populate('user_id').populate({
      path: 'comments',
      populate: [
        { path: 'user_id', model: 'User' },
        { path: 'replies.user_id', model: 'User' }
      ],
    });

    console.log(contentBasedPosts)  

    // 2. Popular posts (high engagement score)
    const popularPosts = await ForumPost.find({})
      .populate('user_id')
      .populate({
        path: 'comments',
        populate: [
          { path: 'user_id', model: 'User' },
          { path: 'replies.user_id', model: 'User' }
        ],
      })
      .sort({ engagement_score: -1, created_at: -1 });
      console.log(popularPosts)

    // 3. Recent posts (time-based)
    const recentPosts = await ForumPost.find({})
      .populate('user_id')
      .populate({
        path: 'comments',
        populate: [
          { path: 'user_id', model: 'User' },
          { path: 'replies.user_id', model: 'User' }
        ],
      })
      .sort({ created_at: -1 });
      console.log(recentPosts)

    // 4. Trending posts (posts with recent activity)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const trendingPosts = await ForumPost.find({
      $or: [
        { created_at: { $gte: oneWeekAgo } },
        { updated_at: { $gte: oneWeekAgo } },
        { 'comments.created_at': { $gte: oneWeekAgo } }
      ]
    })
    .populate('user_id')
    .populate({
      path: 'comments',
      populate: [
        { path: 'user_id', model: 'User' },
        { path: 'replies.user_id', model: 'User' }
      ],
    })
    .sort({ engagement_score: -1 });

    // 5. Collaborative filtering (posts from users with similar interests)
    const userLikedPosts = await ForumPost.find({ likes: userId });
    const similarUsers = await ForumPost.distinct('user_id', {
      likes: { $in: userLikedPosts.map(post => post._id) },
      user_id: { $ne: userId }
    });

    const collaborativePosts = await ForumPost.find({
      user_id: { $in: similarUsers },
      _id: { $nin: userLikedPosts.map(post => post._id) }
    })
    .populate('user_id')
    .populate({
      path: 'comments',
      populate: [
        { path: 'user_id', model: 'User' },
        { path: 'replies.user_id', model: 'User' }
      ],
    })
    .sort({ engagement_score: -1 });

    // 6. Random posts for discovery
    const randomPosts = shuffleArray(await ForumPost.find({})
      .populate('user_id')
      .populate({
        path: 'comments',
        populate: [
          { path: 'user_id', model: 'User' },
          { path: 'replies.user_id', model: 'User' }
        ],
      }));

    // Combine all recommendation types with weights
    const allPosts = [
      ...contentBasedPosts.map(post => ({ ...post.toObject(), weight: 5, type: 'contentBased' })),
      ...popularPosts.map(post => ({ ...post.toObject(), weight: 4, type: 'popular' })),
      ...trendingPosts.map(post => ({ ...post.toObject(), weight: 3, type: 'trending' })),
      ...recentPosts.map(post => ({ ...post.toObject(), weight: 2, type: 'recent' })),
      ...collaborativePosts.map(post => ({ ...post.toObject(), weight: 1, type: 'collaborative' })),
      ...randomPosts.map(post => ({ ...post.toObject(), weight: 0.5, type: 'random' }))
    ];

    // Remove duplicates and calculate weighted scores
    const uniquePostsMap = new Map();
    allPosts.forEach(post => {
      const postId = post._id.toString();
      if (uniquePostsMap.has(postId)) {
        const existing = uniquePostsMap.get(postId);
        existing.weight += post.weight;
        // Keep track of all types this post appears in
        if (!existing.types) existing.types = [];
        existing.types.push(post.type);
      } else {
        post.types = [post.type];
        uniquePostsMap.set(postId, post);
      }
    });

    const uniquePosts = Array.from(uniquePostsMap.values())
      .sort((a, b) => b.weight - a.weight)
      .map(post => {
        const { weight, type, types, ...postWithoutWeight } = post;
        return {
          ...postWithoutWeight,
          recommendationTypes: types || [type]
        };
      });

    const paginatedPosts = uniquePosts.slice((pageNo - 1) * resultPerPage, pageNo * resultPerPage);

    if (paginatedPosts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No more Posts",
      });
    }

    // Calculate recommendation statistics
    const recommendationStats = {
      contentBased: contentBasedPosts.length,
      popular: popularPosts.length,
      trending: trendingPosts.length,
      recent: recentPosts.length,
      collaborative: collaborativePosts.length,
      random: randomPosts.length
    };

    res.status(200).json({
      posts: paginatedPosts,
      totalPosts: uniquePosts.length,
      currentPage: pageNo,
      totalPages: Math.ceil(uniquePosts.length / resultPerPage),
      recommendations: recommendationStats,
      userTags: userTags
    });

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

    // Emit real-time event for new comment
    if (global.io) {
      global.io.emit('new-comment', { 
        postId: req.params.id, 
        comment: populatedForumPost.comments[populatedForumPost.comments.length - 1],
        post: populatedForumPost 
      });
    }

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

    // Emit real-time event for new reply
    if (global.io) {
      const updatedComment = populatedForumPost.comments.id(req.params.commentId);
      global.io.emit('new-reply', { 
        postId: req.params.postId, 
        commentId: req.params.commentId,
        reply: updatedComment.replies[updatedComment.replies.length - 1],
        post: populatedForumPost 
      });
    }

    res.status(200).json(populatedForumPost);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add a like to a forum post
exports.addLike = async (req, res) => {
  console.log(req.user._id)
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

// Increment view count
exports.incrementView = async (req, res) => {
  try {
    const postId = req.params.id;
    const forumPost = await ForumPost.findByIdAndUpdate(
      postId,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!forumPost) {
      return res.status(404).json({ message: 'Forum post not found' });
    }

    res.status(200).json({ message: 'View count updated', views: forumPost.views });
  } catch (error) {
    console.error("Error in incrementView:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
