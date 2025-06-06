const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blogController");
const multer = require("multer");
const path = require("path");
const { verifyToken } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
// Routes with multer middleware
router.post("/blogs", verifyToken, blogController.createBlog);
router.get("/blogs", blogController.getAllBlogs);
router.get("/blogs/:id", verifyToken, blogController.getBlogById);
router.put("/blogs/:id", verifyToken, blogController.updateBlog);
router.delete("/blogs/:id", verifyToken, blogController.deleteBlog);

module.exports = router;
