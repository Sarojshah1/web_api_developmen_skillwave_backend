const express = require("express");
const router = express.Router();
const enrollmentController = require("../controllers/enrollmentController");
const { verifyToken } = require("../middlewares/authMiddleware");

// Create a new enrollment
router.post("/", verifyToken, enrollmentController.createEnrollment);

// Update an enrollment
router.put("/:id", verifyToken, enrollmentController.updateEnrollment);

// Delete an enrollment
router.delete("/:id", verifyToken, enrollmentController.deleteEnrollment);

// Get all enrollments for a user
router.get("/user", verifyToken, enrollmentController.getUserEnrollments);

module.exports = router;
