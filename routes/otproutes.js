const express = require("express");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const OTP = require("../models/otp");
require("dotenv").config();
const otprouter = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "sarojahah152@gmail.com",
    pass: process.env.APP_PASSWORD,
  },
});

otprouter.post("/", async (req, res) => {
  const { email } = req.body;
  console.log(email);
  const otp = randomstring.generate({ length: 6, charset: "numeric" });

  const otpExpiration = new Date();
  otpExpiration.setMinutes(otpExpiration.getMinutes() + 5);

  try {
    await OTP.findOneAndUpdate(
      { email: email },
      { otp: otp, otpExpiration: otpExpiration },
      { upsert: true }
    );

    const mailOptions = {
      from: `"Skillwave Support" <${process.env.USER}>`,
      to: email,
      subject: "Your One-Time Password (OTP) from Skillwave",
      html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #2c3e50;">Hello,</h2>
      <p>We received a request to access your Skillwave account. Use the OTP below to proceed:</p>

      <div style="font-size: 24px; font-weight: bold; margin: 20px 0; padding: 10px; background-color: #f0f4f8; border-radius: 5px; width: fit-content;">
        ${otp}
      </div>

      <p>This OTP is valid for <strong>5 minutes</strong>.</p>
      
      <p>If you did not request this, please ignore this email or contact our support immediately.</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      
      <p style="font-size: 14px; color: #777;">
        Thank you for choosing <strong>Skillwave</strong>.<br>
        If you need assistance, contact us at <a href="mailto:support@skillwave.com">support@skillwave.com</a>.<br>
        This is an automated message, please do not reply directly.
      </p>
    </div>
  `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).send("Failed to send OTP");
      } else {
        console.log("OTP sent successfully");
        res.status(200).send("OTP sent successfully");
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to send OTP");
  }
});

module.exports = otprouter;
