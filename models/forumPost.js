const mongoose = require("mongoose");
const { Schema } = mongoose;

const commentSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  replies: [
    {
      user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      created_at: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const forumPostSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  images: [
    {
      type: String,
      default: null,
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  tags: [
    {
      type: String,
    },
  ],
  category: {
    type: String,
    enum: ["general", "academic", "technical", "social", "announcement", "question", "discussion"],
    default: "general"
  },
  likes: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  views: {
    type: Number,
    default: 0
  },
  engagement_score: {
    type: Number,
    default: 0
  },
  comments: [commentSchema],
});

// Calculate engagement score before saving
forumPostSchema.pre('save', function(next) {
  this.engagement_score = (this.likes.length * 2) + (this.comments.length * 3) + this.views;
  next();
});

const ForumPost = mongoose.model("ForumPost", forumPostSchema);

module.exports = ForumPost;
