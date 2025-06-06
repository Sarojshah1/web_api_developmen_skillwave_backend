const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Route to create a new payment
router.post('/', verifyToken, paymentController.createPayment);

// Route to get all payments
router.get('/', verifyToken, paymentController.getAllPayments);

// Route to get a specific payment by ID
router.get('/:id', verifyToken, paymentController.getPaymentById);

// Route to update a payment by ID
router.put('/:id', verifyToken, paymentController.updatePayment);

// Route to delete a payment by ID
router.delete('/:id', verifyToken, paymentController.deletePayment);

module.exports = router;
