const mongoose = require("mongoose");
const { Schema } = mongoose;

const quizSchema = new Schema({
  course_id: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  total_marks: { type: Number, required: true },
  passing_marks: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  questions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
});

const Quiz = mongoose.model("Quiz", quizSchema);
module.exports = Quiz;
