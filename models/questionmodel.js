const mongoose = require("mongoose");
const { Schema } = mongoose;

const questionSchema = new Schema({
  quiz_id: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
  question_text: { type: String, required: true },
  question_type: { type: String, required: true },
  options: [{ type: String }], // Only for multiple_choice questions
  correct_answer: { type: String, required: true },
});

const Question = mongoose.model("Question", questionSchema);
module.exports = Question;
