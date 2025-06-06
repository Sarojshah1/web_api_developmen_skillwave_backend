const jwt = require('jsonwebtoken');
const User = require('../models/usersmodel');
require('dotenv').config();

// Middleware to check for authentication
exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log(authHeader);
    
    // Check if authorization header is present
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Extract the token from the header
    const token = authHeader.split(" ")[1];
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    console.log('Received Token:', token);
    // console.log('Decoded Data:', decodedData);
    
    
    // Verify the token
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    console.log("decodedData"+decodedData.id);
    
    // Fetch the user associated with the token
    const user = await User.findById(decodedData.id);
    console.log(user);
    
    // Check if user exists
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User doesn't exist.",
      });
    }
    
    // Attach user to request object
    req.user = user;
    next();
    
  } catch (error) {
    console.error("Auth Middleware Error:", error);

    // Handle specific JWT errors
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

    // General server error response
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};
