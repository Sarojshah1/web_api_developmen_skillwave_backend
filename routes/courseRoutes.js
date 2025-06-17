const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");
const { verifyToken } = require("../middlewares/authMiddleware");

// Route to create a new course
router.post("/", verifyToken, courseController.createCourse);

// Route to get all courses
router.get("/", courseController.getCourses);
router.get("/pagination", courseController.getPaginationCourses);

router.get(
  "/creator",
  verifyToken,
  courseController.getCoursesByCreator
);

// Route to get a specific course by ID
router.get("/:id", verifyToken, courseController.getCourseById);

// Route to update a course by ID
router.put("/:id", verifyToken, courseController.updateCourse);

// Route to delete a course by ID
router.delete("/:id", verifyToken, courseController.deleteCourse);

router.get(
  "/category/:categoryId",
  verifyToken,
  courseController.getCoursesByCategory
);


module.exports = router;
