const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "tutor", "admin"], required: true },
  profile_picture: { type: String, required: true },
  bio: { type: String, default: "" },
  search_history: [{ type: String }],
  created_at: { type: Date, default: Date.now },
  enrolled_courses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
  payments: [{ type: Schema.Types.ObjectId, ref: "Payment" }],
  blog_posts: [{ type: Schema.Types.ObjectId, ref: "Blog" }],
  quiz_results: [{ type: Schema.Types.ObjectId, ref: "UserQuizResult" }],
  reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
  certificates: [{ type: Schema.Types.ObjectId, ref: "Certificate" }],
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
