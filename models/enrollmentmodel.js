const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const enrollmentSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  course_id: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  enrollment_date: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["in-progress", "completed"],
    default: "in-progress",
  },
  progress: { type: Number, default: 0 },
  completed_at: { type: Date },
});

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
module.exports = Enrollment;
