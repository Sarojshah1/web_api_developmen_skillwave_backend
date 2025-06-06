const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const courseSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  created_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
  category_id: { type: Schema.Types.ObjectId, ref: "Category" },
  price: { type: Number, default: 0 },
  duration: { type: String, required: true },
  level: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "beginner",
  },
  thumbnail: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  lessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
  quizzes: [{ type: Schema.Types.ObjectId, ref: "Quiz" }],
  reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
  certificates: [{ type: Schema.Types.ObjectId, ref: "Certificate" }],
});

const Course = mongoose.model("Course", courseSchema);
module.exports = Course;
