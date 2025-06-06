const Certificate = require('../models/certificatemodel');
const User = require('../models/usersmodel');
const Course = require('../models/coursemodel');
const path = require('path');
const fs = require('fs');

// Create a new certificate
exports.createCertificate = async (req, res) => {
  try {
    const {  course_id } = req.body;
    const user_id=req.user._id;

    // Validate that user and course exist
    const user = await User.findById(user_id);
    const course = await Course.findById(course_id);
    
    if (!user || !course) {
      return res.status(404).json({ message: 'User or Course not found' });
    }

    let certificatePath = null;

  
    if (req.files && req.files.certificate) {
      const { certificate } = req.files;
      certificatePath = `certificate-${Date.now()}-${certificate.name}`;
      const uploadPath = path.join(__dirname, `../public/certificate/${certificatePath}`);
      
      // Create directory if it doesn't exist
      const directoryPath = path.join(__dirname, '../public/certificate');
      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }

      await certificate.mv(uploadPath);
    }


    const certificate = new Certificate({
      user_id,
      course_id,
      certificate:certificatePath
    });

    const savedCertificate = (await certificate.save()).populate('course_id');
    await User.findByIdAndUpdate(user_id, {
        $push: { certificates: savedCertificate._id }
      });
    res.status(201).json(savedCertificate);
  } catch (error) {
    console.error("Error in createCertificate:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all certificates
exports.getAllCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find()
      .populate('user_id')
      .populate('course_id');
    res.status(200).json(certificates);
  } catch (error) {
    console.error("Error in getAllCertificates:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a specific certificate by ID
exports.getCertificateById = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('user_id')
      .populate('course_id');
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    res.status(200).json(certificate);
  } catch (error) {
    console.error("Error in getCertificateById:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a certificate by ID
exports.updateCertificate = async (req, res) => {
  try {
    const { user_id, course_id, certificate } = req.body;
    const updateData = { user_id, course_id, certificate };

    const certificates = await Certificate.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('user_id')
      .populate('course_id');
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    res.status(200).json(certificates);
  } catch (error) {
    console.error("Error in updateCertificate:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a certificate by ID
exports.deleteCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findByIdAndDelete(req.params.id);
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    res.status(200).json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    console.error("Error in deleteCertificate:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
