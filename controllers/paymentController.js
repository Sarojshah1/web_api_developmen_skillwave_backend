const Payment = require('../models/Paymentmodel');
const User = require('../models/usersmodel');
const Course = require('../models/coursemodel');
const Enrollment = require('../models/enrollmentmodel');

// Create a new payment
exports.createPayment = async (req, res) => {
  try {
    const {  course_id, amount, payment_method, status } = req.body;

    // Validate that user and course exist
    const user = await User.findById(req.user._id);
    const course = await Course.findById(course_id);
    
    if (!user ) {
      return res.status(404).json({ message: 'User  not found' });
    }
    if ( !course) {
      return res.status(404).json({ message: ' Course not found' });
    }

    const payment = new Payment({
      user_id:req.user._id,
      course_id,
      amount,
      payment_method,
      status
    });

    const newEnrollment = new Enrollment({
      user_id: req.user._id,
      course_id
    });
    const savedPayment = await payment.save();
    const savedEnrollment = await newEnrollment.save();
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $addToSet: {
          payments: savedPayment._id,
          enrolled_courses: course_id,
        },
      },
      { new: true, useFindAndModify: false } 
    );
        const updatedUser = await User.findById(req.user._id)
      .populate('enrolled_courses')
      .populate('payments');
    res.status(201).json({
      message: 'Payment and enrollment created successfully',
      payment: savedPayment,
      enrollment: savedEnrollment,
      updatedUser, 
    });
  } catch (error) {
    console.error("Error in createPayment:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all payments
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('user_id')
      .populate('course_id');
    res.status(200).json(payments);
  } catch (error) {
    console.error("Error in getAllPayments:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a specific payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user_id')
      .populate('course_id');
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.status(200).json(payment);
  } catch (error) {
    console.error("Error in getPaymentById:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a payment by ID
exports.updatePayment = async (req, res) => {
  try {
    const { user_id, course_id, amount, payment_method, status } = req.body;
    const updateData = { user_id, course_id, amount, payment_method, status };

    const payment = await Payment.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('user_id')
      .populate('course_id');
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error("Error in updatePayment:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a payment by ID
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.status(200).json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error("Error in deletePayment:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
