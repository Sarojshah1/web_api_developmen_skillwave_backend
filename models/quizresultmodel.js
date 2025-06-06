const mongoose = require("mongoose");
const { Schema } = mongoose;

const userQuizResultSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  quiz_id: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
  score: {
    type: Number,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: "Score must be an integer value.",
    },
  },
  status: { type: String, enum: ["passed", "failed"], default: "failed" },
  attempted_at: { type: Date, default: Date.now },
});

const UserQuizResult = mongoose.model("UserQuizResult", userQuizResultSchema);
module.exports = UserQuizResult;
