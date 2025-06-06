const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const groupProjectSchema = new Schema({
  project_name: { type: String, required: true, trim: true },
  group_image: { type: String },
  description: { type: String, required: true },
  github_link: { type: String, required: true, trim: true },
  created_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      validate: [arrayLimit, "{PATH} exceeds the limit of 5"],
      required: true,
    },
  ],
  tasks: [
    {
      task_name: { type: String, required: true },
      assigned_to: { type: Schema.Types.ObjectId, ref: "User", required: true },
      status: {
        type: String,
        enum: ["pending", "in-progress", "completed"],
        default: "pending",
      },
      deadline: { type: Date },
    },
  ],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

function arrayLimit(val) {
  return val.length <= 5;
}

groupProjectSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

const GroupProject = mongoose.model("GroupProject", groupProjectSchema);
module.exports = GroupProject;
