const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const File = require("../model/fileupload");

const Router = express.Router();

const SECRET_KEY = "password"; // Replace with a secure key

const nodemailer = require("nodemailer");
const crypto = require("crypto");

require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Router.post("/send-password-otp", async (req, res) => {
//   const { email } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ message: "User not found" });

//     // Generate 6-digit OTP
//     const otpCode = crypto.randomInt(100000, 999999).toString();
    
//     // Set expiry to 5 minutes from now
//     const expiresAt = new Date(Date.now() + 5 * 60 * 1000); 

//     // Save OTP to user
//     user.otp = { code: otpCode, expiresAt };
//     await user.save();

//     // Send mail
//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "Your OTP Code",
//       text: `Your OTP code is ${otpCode}. It will expire in 5 minutes.`,
//     };

//     await transporter.sendMail(mailOptions);

//     res.status(200).json({ message: "OTP sent", email: user.email });
//   } catch (err) {
//     console.error("Error sending OTP:", err.message);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// Generate a reset token for password reset link

Router.post("/send-password-otp", async (req, res) => {
  const { email } = req.body;
  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
  
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Generate 6-digit OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    
    // Generate a unique reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    // Set expiry to 1 hour from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    
    // Save OTP and reset token to user
    user.otp = {
      code: otpCode,
      expiresAt: expiresAt,
      resetToken: resetToken,
      verified: false
    };
    await user.save();
    
    // Create reset links
    const otpVerificationLink = `${FRONTEND_URL}/verify-otp?email=${encodeURIComponent(email)}&token=${resetToken}`;
    const passwordResetLink = `${FRONTEND_URL}/reset-password/${resetToken}`;
    
    // Send mail with both OTP and links
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your account.</p>
        <p><strong>Your OTP code is: ${otpCode}</strong></p>
        <p>This code will expire in 2 min.</p>
        <p>Click the link below to verify your OTP:</p>
        <a href="${otpVerificationLink}" style="display: inline-block; padding: 5px 5px; background-color: #4285f4; color: white; text-decoration: none; border-radius: 4px;">Verify OTP</a>


      `,
    };
    
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({
      message: "Password reset instructions sent to your email",
      // In production, don't send the token back to frontend for security reasons
      // Only for development
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (err) {
    console.error("Error sending password reset instructions:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Verify OTP code
Router.post("/verify-otp", async (req, res) => {
  console.log("wqheiuwqehh")
  const { email, otp } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if OTP exists and has not expired
    if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
      return res.status(400).json({ message: "No OTP was sent or it has been used" });
    }
    
    // Check if OTP has expired
    if (new Date() > new Date(user.otp.expiresAt)) {
      return res.status(400).json({ message: "OTP has expired" });
    }
    
    // Verify OTP
    if (user.otp.code !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    
    // Mark OTP as verified
    user.otp.verified = true;
    await user.save();
    
    // Return the reset token for the next step
    res.status(200).json({
      message: "OTP verified successfully",
      verified: true,
      resetToken: user.otp.resetToken
    });
  } catch (err) {
    console.error("Error verifying OTP:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Verify token validity without OTP (when accessing reset page directly)
Router.get("/verify-reset-token/:token", async (req, res) => {
  const { token } = req.params;
  
  try {
    const user = await User.findOne({
      "otp.resetToken": token,
      "otp.expiresAt": { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }
    
    res.status(200).json({
      message: "Valid reset token",
      email: user.email,
      otpVerified: !!user.otp.verified
    });
  } catch (err) {
    console.error("Error verifying reset token:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Reset password with token
Router.post("/api/auth/reset-password", async (req, res) => {
  const { resetToken, newPassword } = req.body;
  
  try {
    const user = await User.findOne({
      "otp.resetToken": resetToken,
      "otp.expiresAt": { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }
    
    // Check if OTP was verified first
    if (!user.otp.verified) {
      return res.status(400).json({ message: "Please verify your OTP first" });
    }
    
    // Hash the password before saving
    const bcrypt = require('bcrypt');
    const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password and clear OTP data
    user.password = newPassword;
    user.otp = { code: null, expiresAt: null, resetToken: null, verified: false };
    await user.save();
    
    res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Error resetting password:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// **User Registration (User/Admin)**
Router.post("/register", async (req, res) => {
  try {
    const { name, email, password, sharedfilecount } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Validate role (This check is not effective as written; adjust if needed)
    if (!["user", "admin", "guest"]) {
      return res.status(400).json({ error: "Invalid role. Must be 'user', 'admin', or 'guest'." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use." });
    }

    // Store plain text password (no hashing)
    const newUser = new User({
      name,
      email,
      password,
      sharedfilecount,
    });

    await newUser.save();

    // Respond with userId & username so the frontend can store them
    res.status(201).json({
      message: "User registered successfully.",
      userId: newUser._id,
      username: newUser.name,
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: "Server error. Please try again." });
  }
});


const { ObjectId } = require("mongoose").Types;

const ADMIN_CREDENTIALS = {
  email: "admin@gmail.com" ,
  password: "admin123" ,
  userId: new ObjectId().toString(), //  ObjectId-like userId for admin
};

Router.post("/login", async (req, res) => {

  console.log("qerjhqwjrqew")
  const { email, password } = req.body;

  try {
    // Admin Login (Direct Check)
    if (email === ADMIN_CREDENTIALS.email) {
      if (password !== ADMIN_CREDENTIALS.password) {
        return res.status(400).json({ error: "Invalid admin credentials." });
      }
      const token = jwt.sign(
        { email, role: "admin", userId: ADMIN_CREDENTIALS.userId },
        SECRET_KEY,
        { expiresIn: "1h" }
      );
      return res.status(200).json({
        token,
        role: "admin",
        userId: ADMIN_CREDENTIALS.userId,
      });
    }

    // Normal User Login (Check DB)
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found." });

    if (password !== user.password)
      return res.status(400).json({ error: "Invalid credentials." });

    const token = jwt.sign(
      { email: user.email, role: "user", userId: user._id.toString() },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.status(200).json({ token, role: "user", userId: user._id.toString() });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Server error." });
  }
});




Router.get("/files-with-usersed", async (req, res) => {
  try {
    const filesWithUsers = await File.aggregate([
      {
        $lookup: {
          from: "sendotps", // Ensure correct collection name
          localField: "filename", // Match File.filename with Sendotp.filename
          foreignField: "filename",
          as: "otpDetails",
        },
      },
      {
        $lookup: {
          from: "users", // Ensure correct collection name
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $addFields: {
          downloadStatus: {
            $cond: {
              if: { $eq: ["$downloaded", "Not Downloaded"] },
              then: "Not Downloaded",
              else: "Downloaded",
            },
          },
        },
      },
    ]);

    res.status(200).json(filesWithUsers);
  } catch (error) {
    console.error(" Error fetching files with user and OTP details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

Router.get("/files-with-users", async (req, res) => {
  try {
    const filesWithUsers = await File.aggregate([
      {
        $lookup: {
          from: "sendotps", // Name of the Sendotp collection in MongoDB
          localField: "filename", // Match File.filename with Sendotp.filename
          foreignField: "filename",
          as: "otpDetails",
        },
      },
      {
        $lookup: {
          from: "users", // Name of the User collection
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 1,
          filename: 1,
          size: 1,
          path: 1,
          downloaded: 1,
          sharedCount: 1,
          originalname: 1,
          createdAt: 1,
          updatedAt: 1,
          recivermail:1,
          user: {
            _id: "$userDetails._id",
            name: "$userDetails.name",
            email: "$userDetails.email",
            sharedfilecount: { $ifNull: ["$userDetails.sharedfilecount", 0] },
            otpSentCount: { $ifNull: ["$userDetails.otpSentCount", 0] },
          },
          otpDetails: { 
            $arrayElemAt: ["$otpDetails", 0]  // Grab the first OTP object if it exists
          }
        },
      },
    ]);

    // Now otpDetails will be an object instead of an array
    res.status(200).json(filesWithUsers);
  } catch (error) {
    console.error("🚨 Error fetching files with user and OTP details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

Router.get("/files-with-users-ids/:id", async (req, res) => {
  const{id}=req.params.id
  try {
    const filesWithUsers = await File.aggregate([
      {
        $lookup: {
          from: "sendotps", // Name of the Sendotp collection in MongoDB
          localField: "filename", // Match File.filename with Sendotp.filename
          foreignField: "filename",
          as: "otpDetails",
        },
      },
      {
        $lookup: {
          from: "users", // Name of the User collection
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 1,
          filename: 1,
          size: 1,
          path: 1,
          downloaded: 1,
          sharedCount: 1,
          originalname: 1,
          createdAt: 1,
          updatedAt: 1,
          user: {
            _id: "$userDetails._id",
            name: "$userDetails.name",
            email: "$userDetails.email",
            sharedfilecount: { $ifNull: ["$userDetails.sharedfilecount", 0] },
            otpSentCount: { $ifNull: ["$userDetails.otpSentCount", 0] },
          },
          otpDetails: { 
            $arrayElemAt: ["$otpDetails", 0]  // Grab the first OTP object if it exists
          }
        },
      },
    ]);

    // Now otpDetails will be an object instead of an array
    res.status(200).json(filesWithUsers);
  } catch (error) {
    console.error(" Error fetching files with user and OTP details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


Router.get("/files-with-usered", async (req, res) => {
  try {

    const filesWithUsers = await File.find().populate("userId", "name email sharedfilecount otpSentCount");


    const formattedFiles = filesWithUsers.map(file => ({
      _id: file._id,
      filename: file.filename,
      size: file.size || "Unknown", 
      path: file.path,
      downloaded: file.downloaded,
      sharedCount: file.sharedCount,
      originalname: file.originalname,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      user: file.userId
        ? {
          name: file.userId.name,
          email: file.userId.email,
          sharedfilecount: file.userId.sharedfilecount || "0",
          otpSentCount: file.userId.otpSentCount || 0,
          _id: file.userId._id || 0,
        }
        : null,
    }));

    res.status(200).json(formattedFiles);
  } catch (error) {
    console.error("Error fetching files with user details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


//  Route: Delete a file along with user details
Router.delete("/files-with-users/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!fileId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid file ID." });
    }

    // Find the file by ID and populate user details
    const file = await File.findById(fileId).populate("userId");

    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    // Optional: Delete the associated file from the filesystem if needed
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(__dirname, "../uploads", file.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete the file from the database
    await File.findByIdAndDelete(fileId);

    res.status(200).json({ message: "File deleted successfully." });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ message: "Failed to delete file." });
  }
});





//  DELETE route to remove a file by file ID (accessible to all roles)
Router.delete("/delete-file/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;

    // 🟠 Validate File ID
    if (!fileId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid file ID." });
    }

    // 🔍 Check if File Exists
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    // 🗑️ Delete the File
    await File.findByIdAndDelete(fileId);

    res.status(200).json({ message: "File deleted successfully." });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ message: "Failed to delete file." });
  }
});



const mongoose = require('mongoose');

Router.get("/files-with-users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    //  Check if the provided ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid User ID" });
    }

    // Fetch files belonging to the specific user with populated user and OTP details
    const filesWithUsers = await File.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(id), // Correct usage of ObjectId
        },
      },
      {
        $lookup: {
          from: "sendotps", // Name of the Sendotp collection in MongoDB
          localField: "filename", // Match File.filename with Sendotp.filename
          foreignField: "filename",
          as: "otpDetails",
        },
      },
      {
        $lookup: {
          from: "users", // Name of the User collection
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 1,
          filename: 1,
          size: 1,
          path: 1,
          downloaded: 1,
          sharedCount: 1,
          originalname: 1,
          createdAt: 1,
          updatedAt: 1,
          recivermail:1,
          user: {
            _id: "$userDetails._id",
            name: "$userDetails.name",
            email: "$userDetails.email",
            sharedfilecount: { $ifNull: ["$userDetails.sharedfilecount", 0] },
            otpSentCount: { $ifNull: ["$userDetails.otpSentCount", 0] },
          },
          otpDetails: {
            $arrayElemAt: ["$otpDetails", 0], // Grab the first OTP object if it exists
          },
        },
      },
    ]);

    // Return 404 if no files are found
    if (!filesWithUsers || filesWithUsers.length === 0) {
      return res.status(404).json({ message: "No files found for this user" });
    }

    //  Send the formatted response to the frontend
    res.status(200).json(filesWithUsers);
  } catch (error) {
    console.error("Error fetching files for user:", error); // Log the error in detail
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});




Router.get("/allusers", async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: "files",
          localField: "_id",
          foreignField: "userId",
          as: "files",
        },
      },
      {
        $lookup: {
          from: "sendotps",
          localField: "email",
          foreignField: "email",
          as: "otps",
        },
      },
      {
        $addFields: {
          fileCount: { $size: "$files" },
          sharedCount: {
            $sum: {
              $map: {
                input: "$files",
                as: "file",
                in: { $cond: [{ $ifNull: ["$$file.path", false] }, 1, 0] },
              },
            },
          },
          otpCount: { $size: "$otps" },
        },
      },
      {
        $project: {
          password: 0,
          "files.password": 0,
          "otps.otp": 0, // Exclude OTP field
        },
      },
    ]);

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching user, file, and OTP data:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});


//all user in profile mode//
Router.get("/alluserss", async (req, res) => {
  try {
    const users = await User.find();

    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const fileCount = await File.countDocuments({ userId: user._id });
        return {
          ...user.toObject(),
          fileCount,
          otpSentCount: user.otpSentCount || 0, // Include OTP count
        };
      })
    );

    res.status(200).json(usersWithCounts);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});


//  **Guest Mode (No Login Required)**
Router.get("/guest", (req, res) => {
  res.json({ message: "Welcome, Guest! You have limited access." });
});

//  **Middleware for Admin Routes**
function authenticateAdmin(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.role !== "admin") return res.status(403).json({ error: "Access denied" });

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}

// 🟢 **Admin Dashboard (Protected Route)**
Router.get("/admin-dashboard", authenticateAdmin, (req, res) => {
  res.json({ message: "Welcome Admin!" });
});

// **Edit User Route**
Router.put("/edit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedUser) return res.status(404).json({ error: "User not found." });
    res.status(200).json({ message: "User updated successfully.", user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Server error." });
  }
});

// **Delete User Route**
Router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) return res.status(404).json({ error: "User not found." });
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = Router;
