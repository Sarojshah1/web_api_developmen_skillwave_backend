const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const lessonSchema = new Schema({
  course_id: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  video_url: { type: String, default: null },
  order: { type: Number, default: 0 },
});

const Lesson = mongoose.model("Lesson", lessonSchema);
module.exports = Lesson;
