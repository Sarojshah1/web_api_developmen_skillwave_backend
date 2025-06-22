const User = require("../models/usersmodel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, bio } = req.body;
    console.log("Request Body:", req.body);

    console.log(req.files);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    let picturePath = null;
    if (req.files && req.files.profile_picture) {
      const { profile_picture } = req.files;
      picturePath = `profile-${Date.now()}-${profile_picture.name}`;
      const uploadPath = path.join(
        __dirname,
        `../public/profile/${picturePath}`
      );
      console.log(profile_picture);
      const directoryPath = path.join(__dirname, "../public/profile");
      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }

      await profile_picture.mv(uploadPath);
    }
    const user = new User({
      name,
      email,
      password,
      role,
      profile_picture: picturePath,
      bio,
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    console.log(user);  
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET
    );

    res.status(200).json({ token, role: user.role, id: user._id });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "enrolled_courses",
        populate: {
          path: "created_by",
          model: "User",
        },
        populate: {
          path: "category_id",
          model: "Category",
        },
        populate: {
          path: "lessons",
          model: "Lesson",
        },
        populate: {
          path: "quizzes",
          model: "Quiz",
        },
        populate: {
          path: "reviews",
          model: "Review",
        },
        populate: {
          path: "certificates",
          model: "Certificate",
        },
      })
      .populate({
        path: "quiz_results",
        populate: {
          path: "quiz_id",
          model: "Quiz",
        },
      })
      .populate({
        path: "certificates",
        populate: {
          path: "course_id",
          model: "Course",
        },
      });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Find the user by ID
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare old password
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res
        .status(400)
        .json({
          message: "Incorrect  password,please provide correct password",
        });
    }

    // Hash the new password and update it
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.updateUserDetails = async (req, res) => {
  try {
    const { name, email, bio } = req.body;

    // Find the user by ID and update details
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email, bio },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "User details updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
exports.updateProfilePicture = async (req, res) => {
  try {
    if (!req.files || !req.files.profile_picture) {
      return res.status(400).json({ message: "No profile picture uploaded" });
    }

    console.log(req.files);
    const { profile_picture } = req.files;
    const picturePath = `profile-${Date.now()}-${profile_picture.name}`;
    const uploadPath = path.join(__dirname, `../public/profile/${picturePath}`);

    // Create directory if it doesn't exist
    const directoryPath = path.join(__dirname, "../public/profile");
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    await profile_picture.mv(uploadPath);

    // Find the user by ID and update profile picture
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profile_picture: picturePath },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "Profile picture updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
exports.updatePasswordByEmail = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User with this email does not exist" });
    }
    user.password = newPassword;

    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.addToSearchHistory = async (req, res) => {
  try {
    const { searchTerm } = req.body;

    if (!searchTerm || typeof searchTerm !== "string") {
      return res.status(400).json({ message: "Invalid search term" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { search_history: searchTerm } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "Search term added to history", search_history: user.search_history });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
