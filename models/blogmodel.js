const mongoose = require("mongoose");
const { Schema } = mongoose;

const blogSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  tags: [{ type: String }],
});

const Blog = mongoose.model("Blog", blogSchema);
module.exports = Blog;
