const jwt = require('jsonwebtoken');
const User = require('../models/usersmodel');
require('dotenv').config();

// Middleware to check for authentication
exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log(authHeader);
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }
    const token = authHeader.split(" ")[1];
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    console.log('Received Token:', token);
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    console.log("decodedData"+decodedData.id);
    const user = await User.findById(decodedData.id);
    console.log(user);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User doesn't exist.",
      });
    }
    req.user = user;
    next();
    
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(400).json({
        success: false,
        message: "Invalid token. Please login again.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};
