const express = require("express");
const router = express.Router();
const certificateController = require("../controllers/certificateController");
const { verifyToken } = require("../middlewares/authMiddleware");

// Route to create a new certificate
router.post("/", verifyToken, certificateController.createCertificate);

// Route to get all certificates
router.get("/", verifyToken, certificateController.getAllCertificates);

// Route to get a specific certificate by ID
router.get("/:id", verifyToken, certificateController.getCertificateById);

// Route to update a certificate by ID
router.put("/:id", verifyToken, certificateController.updateCertificate);

// Route to delete a certificate by ID
router.delete("/:id", verifyToken, certificateController.deleteCertificate);

module.exports = router;
