const Enrollment = require('../models/enrollmentmodel');
const User = require('../models/usersmodel');

// Create a new enrollment
exports.createEnrollment = async (req, res) => {
  try {
    const { course_id } = req.body;
    const newEnrollment = new Enrollment({
      user_id: req.user._id,
      course_id
    });

    const savedEnrollment = await newEnrollment.save();
    await User.findByIdAndUpdate(
        req.user._id,
      { $addToSet: { enrolled_courses: course_id } },
      { new: true }
    );

    res.status(201).json(savedEnrollment);
  } catch (error) {
    console.error("Error in createEnrollment:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
exports.updateEnrollment = async (req, res) => {
  try {
    const {  progress } = req.body;
    const { id } = req.params;
    const enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    let updateFields = { progress };

    if (progress === 100) {
      updateFields.status = 'completed';
      updateFields.completed_at = new Date(); 
    }
    const updatedEnrollment = await Enrollment.findByIdAndUpdate(id, updateFields, { new: true });

    res.status(200).json(updatedEnrollment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
exports.deleteEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Remove the course from the user's enrolled_courses
    await User.findByIdAndUpdate(
      enrollment.user_id,
      { $pull: { enrolled_courses: enrollment.course_id } },
      { new: true }
    );

    res.status(200).json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all enrollments for a user
exports.getUserEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user_id: req.user._id}).populate('course_id');
    res.status(200).json(enrollments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
