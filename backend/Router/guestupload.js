require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const nodemailer = require("nodemailer");
const fs = require("fs");

const Guest = require("../model/guest");

const routers = express.Router();
routers.use(express.json());
routers.use(cors());

// Multer Configuration for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Nodemailer Transporter Configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Replace with your email
    pass: process.env.EMAIL_PASS, // Use an App Password if using Gmail
  },
});

// Guest Upload Route (Prevents duplicate sender email uploads)
routers.post("/guest-upload", upload.single("file"), async (req, res) => {
  const { email, receiverEmail } = req.body;

  try {
    // Prevent duplicate sender email uploads
    const existingGuest = await Guest.findOne({ email });
    if (existingGuest) {
      return res.status(200).json({
        success: false,
        message:
          "You have already uploaded a file. Please register and login to continue.",
      });
    }

    // Allow new guest upload
    const newGuest = new Guest({
      email, // Unique sender email check
      receiverEmail,
      filename: req.file.filename,
      path: req.file.path,
      originalname: req.file.originalname,
    });

    await newGuest.save();

    // Send Email with File Attachment
    const mailOptions = {
      from: `"Guest Upload" <${process.env.EMAIL_USER}>`, // Sender email
      to: receiverEmail, // Receiver email
      subject: "New File Upload Notification",
      text: `Hello,\n\nA file has been uploaded by ${email}.\n\nFile Name: ${req.file.originalname}\n\nPlease check the attached file.`,
      attachments: [
        {
          filename: req.file.originalname,
          path: req.file.path, // Attach uploaded file
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    return res
      .status(201)
      .json({
        success: true,
        message: "File uploaded and email sent successfully!",
      });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
});

// GET Route: Retrieve all guest uploads
routers.get("/guest-uploads", async (req, res) => {
  try {
    const uploads = await Guest.find();
    return res
      .status(200)
      // .json({ success: true, uploads });
      .json({ uploads });
  } catch (error) {
    console.error("Error retrieving guest uploads:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
});

// Edit Guest Upload Route
routers.put("/guest-upload/:id", upload.single("file"), async (req, res) => {
  const { email, receiverEmail } = req.body;
  const guestId = req.params.id; // Get the guest ID from the URL

  try {
    // Find the guest upload by ID
    const existingGuest = await Guest.findById(guestId);
    if (!existingGuest) {
      return res.status(404).json({ success: false, message: "Guest upload not found." });
    }

    // If there's a new file, delete the old file from the file system
    if (req.file) {
      fs.unlinkSync(existingGuest.path); // Delete the old file
      existingGuest.filename = req.file.filename;
      existingGuest.path = req.file.path;
      existingGuest.originalname = req.file.originalname;
    }

    // Update the guest's receiver email or any other info
    existingGuest.email = email || existingGuest.email;
    existingGuest.receiverEmail = receiverEmail || existingGuest.receiverEmail;

    await existingGuest.save();

    // Send the email with the new attachment (if there's a new file)
    const mailOptions = {
      from: `"Guest Upload" <${process.env.EMAIL_USER}>`,
      to: existingGuest.receiverEmail,
      subject: "Updated File Upload Notification",
      text: `Hello,\n\nA file has been updated by ${existingGuest.email}.\n\nFile Name: ${existingGuest.originalname}\n\nPlease check the attached file.`,
      attachments: [
        {
          filename: existingGuest.originalname,
          path: existingGuest.path,
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "Guest upload updated successfully!",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// Delete Guest Upload Route
routers.delete("/guest-upload/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Find the guest upload by ID
    const guest = await Guest.findById(id);
    if (!guest) {
      return res.status(404).json({ success: false, message: "Guest upload not found." });
    }

    // Delete the file from the server
    if (fs.existsSync(guest.path)) {
      fs.unlinkSync(guest.path);
    }

    // Delete the guest record from the database
    await Guest.findByIdAndDelete(id);

    return res.status(200).json({ success: true, message: "Guest upload deleted successfully." });
  } catch (error) {
    console.error("Error deleting guest upload:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

routers.get("/guest-download/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Find the guest upload by ID
    const guest = await Guest.findById(id);
    if (!guest) {
      return res.status(404).json({ success: false, message: "File not found." });
    }

    const filePath = path.resolve(guest.path);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "File not found on the server." });
    }

    // Send the file for download
    res.download(filePath, guest.originalname, (err) => {
      if (err) {
        console.error("Error downloading file:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
      }
    });
  } catch (error) {
    console.error("Error in download route:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});


module.exports = routers;
