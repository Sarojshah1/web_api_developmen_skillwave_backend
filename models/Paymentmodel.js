const mongoose = require("mongoose");
const { Schema } = mongoose;

const paymentSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  course_id: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  amount: { type: Number, required: true },
  payment_date: { type: Date, default: Date.now },
  payment_method: {
    type: String,
    enum: ["credit_card", "paypal", "bank_transfer", "Khalti", "esewa"],
    required: true,
  },
  status: {
    type: String,
    enum: ["successful", "pending", "failed"],
    default: "pending",
  },
});

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;
