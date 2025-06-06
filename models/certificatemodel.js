const mongoose = require("mongoose");
const { Schema } = mongoose;

const certificateSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  course_id: {
    type: Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  issued_at: {
    type: Date,
    default: Date.now,
  },
  certificate: {
    type: String,
    required: true,
  },
});

const Certificate = mongoose.model("Certificate", certificateSchema);

module.exports = Certificate;
