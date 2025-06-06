const express = require('express');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const OTP=require("../models/otp");
require('dotenv').config();
const otprouter = express.Router();

const transporter = nodemailer.createTransport({
    service:'gmail',
    host: "smtp.gmail.com",
    port: 587,
    secure: false, 
    auth: {
      user: "sarojahah152@gmail.com",
      pass: process.env.APP_PASSWORD,
    },
  });

  otprouter.post('/', async (req, res) => {

    const { email } = req.body;
    console.log(email);
    const otp = randomstring.generate({ length: 6, charset: 'numeric' });
  

    const otpExpiration = new Date();
    otpExpiration.setMinutes(otpExpiration.getMinutes() + 5); 
  
    try {
      await OTP.findOneAndUpdate(
        { email: email },
        { otp: otp, otpExpiration: otpExpiration },
        { upsert: true }
      );
  
      const mailOptions = {
        from: process.env.USER,
        to: email,
        subject: 'Your OTP from Skillwave',
        text: `Your OTP is: ${otp}`
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          res.status(500).send('Failed to send OTP');
        } else {
          console.log('OTP sent successfully');
          res.status(200).send('OTP sent successfully');
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Failed to send OTP');
    }
  });


  module.exports =  otprouter;
  
