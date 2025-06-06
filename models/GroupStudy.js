const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const groupStudySchema = new Schema({
  group_name: { type: String, required: true, trim: true },
  group_image: { type: String },
  description: { type: String, required: true },
  created_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
  created_at: { type: Date, default: Date.now },
});

const GroupStudy = mongoose.model("GroupStudy", groupStudySchema);
module.exports = GroupStudy;
