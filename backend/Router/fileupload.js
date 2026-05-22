const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const mongoose = require("mongoose");
const otpStore = {};
const guestUploads = {}; // Stores guest email or userId who uploaded


const SECRET_KEY = process.env.SECRET_KEY || "password";
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
dotenv.config();

const fileupload = require("../model/fileupload");
const User = require("../model/user");

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, "../uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 },
});

// 🟢 Function to ensure file size is stored in KB
const formatFileSize = (sizeInBytes) => {
  return (sizeInBytes / 1024).toFixed(2) + " KB";
};

router.post("/uploadfile", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        let { userId } = req.body;

        // Extract userId from JWT if not provided in the request body
        if (!userId) {
            const token = req.headers.authorization?.split(" ")[1];
            if (token) {
                try {
                    const decoded = jwt.verify(token, SECRET_KEY);
                    userId = decoded.userId;
                } catch (err) {
                    return res.status(401).json({ message: "Invalid token." });
                }
            }
        }

        if (!userId) {
            return res.status(400).json({ message: "User ID is required." });
        }

        // Get formatted file size in KB
        const fileSizeKB = formatFileSize(req.file.size);

        // Create a new file document
        const newFile = await fileupload.create({
            filename: req.file.filename,
            originalname: req.file.originalname,
            path: req.file.path,
            size: fileSizeKB, // Store file size in KB
            userId,
        });

        // Update the user's file count automatically
        const user = await User.findById(userId);
        if (user) {
            await user.updateFileCount(); // Ensure this method exists in User model
        }

        res.status(200).json({
            message: "File uploaded successfully.",
            file: newFile,
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({
            message: "File upload failed.",
            error: error.message,
        });
    }
});
router.post("/admin/uploadfile", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    let { userId } = req.body;

    // 🟢 Extract userId from JWT if not provided in the request body
    if (!userId) {
      const token = req.headers.authorization?.split(" ")[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        userId = decoded.userId;
      }
    }

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }
    const fileSizeKB = formatFileSize(req.file.size);
    // Create a new file document
    const newFile = new fileupload({
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      // size: req.file.size,
      size:fileSizeKB,
      userId,
    });

    await newFile.save();
    res
      .status(200)
      .json({ message: "File uploaded successfully.", file: newFile });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "File upload failed.", error: error.message });
  }
});



router.get("/download/:fileId/:userId", async (req, res) => {
  try {
    const { fileId, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ message: "Invalid fileId." });
    }

    let file = userId === "guest"
      ? await fileupload.findById(fileId)
      : await fileupload.findOne({ _id: fileId, userId });

    if (!file) {
      return res.status(404).json({ message: "File not found or unauthorized." });
    }

    const filePath = path.join(UPLOADS_DIR, file.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found." });
    }

    // Send the file to the client
    res.download(filePath, async (err) => {
      if (err) {
        console.error("Download error:", err);
        return res.status(500).json({ message: "Failed to download file." });
      } else {
        // Update the downloaded field to "yes" upon successful download
        await fileupload.findByIdAndUpdate(fileId, { downloaded: "Downloaded" });
        console.log("File downloaded successfully. Updated status to 'yes'.");
      }
    });

  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ message: "Failed to download file." });
  }
});


// 🟢 Secure File Download
// router.get("/download/:fileId/:userId", async (req, res) => {
//   try {
//     const { fileId, userId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(fileId)) {
//       return res.status(400).json({ message: "Invalid fileId." });
//     }

//     let file = userId === "guest"
//       ? await fileupload.findById(fileId)
//       : await fileupload.findOne({ _id: fileId, userId });

//     if (!file) {
//       return res.status(404).json({ message: "File not found or unauthorized." });
//     }

//     const filePath = path.join(UPLOADS_DIR, file.filename);
//     if (!fs.existsSync(filePath)) {
//       return res.status(404).json({ message: "File not found." });
//     }

//     res.download(filePath);
//   } catch (error) {
//     console.error("Download error:", error);
//     res.status(500).json({ message: "Failed to download file." });
//   }
// });


// 🟢 Fetch files uploaded by a user
router.get("/uploadfile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const files = await fileupload.find({ userId });
    res.status(200).json(files);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/uploadfile", async (req, res) => {
  try {
    const files = await fileupload.find();
    res.status(200).json(files);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get("/uploadfilesssd", async (req, res) => {
  try {
    // Get today's date and the date 30 days ago
    const today = new Date();
    const last30Days = new Date();
    last30Days.setDate(today.getDate() - 30); // Get data for the last 30 days

    // MongoDB query to find files uploaded in the last 30 days
    const files = await fileupload.aggregate([
      {
        $match: {
          createdAt: { $gte: last30Days, $lt: today },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, // Group by date (year-month-day)
          fileUploads: { $sum: 1 }, // Count of files uploaded per day
          sharedCount: { $sum: { $cond: [{ $ifNull: ["$path", false] }, 1, 0] } }, // Count of file shares
        },
      },
      {
        $sort: { _id: 1 }, // Sort by date ascending
      },
    ]);

    // Map the result to the desired structure
    const formattedData = files.map((file) => ({
      date: file._id,
      fileUploads: file.fileUploads,
      fileShares: file.fileShares,
    }));

    // Fetch additional statistics (for overall, today, users)
    const overall = {
      files: files.reduce((total, file) => total + file.fileUploads, 0),
      shared: files.reduce((total, file) => total + file.fileShares, 0),
    };

    const todayUploads = await fileupload.countDocuments({
      createdAt: { $gte: today.setHours(0, 0, 0, 0), $lt: new Date() },
    });

    const todayShares = await fileupload.countDocuments({
      createdAt: { $gte: today.setHours(0, 0, 0, 0), $lt: new Date() },
      path: { $exists: true },
    });

    const users = await User.aggregate([
      { $group: { _id: null, registered: { $sum: 1 } } },
    ]);

    const unregistered = await User.countDocuments({});

    const response = {
      formattedData,
      overall,
      today: { files: todayUploads, shared: todayShares },
      users: { registered: users[0]?.registered || 0, unregistered },
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// 🟢 Upload file for guests
router.post("/guest/uploadfile", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const { email } = req.body;

    if (email && guestUploads[email]) {
      return res.status(403).json({ message: "Guests can only upload once." });
    }

    const newFile = new fileupload({
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      userId: "guest",
    });

    await newFile.save();
    if (email) guestUploads[email] = true;

    res.status(200).json({ message: "File uploaded successfully.", file: newFile });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "File upload failed." });
  }
});

// 🟢 Delete file
router.delete("/uploadfile/:id/:userId", async (req, res) => {
  try {
    const { id, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid file id." });
    }

    const file = await fileupload.findOne({ _id: id, userId });
    if (!file) {
      return res.status(404).json({ message: "File not found or unauthorized." });
    }

    await fileupload.deleteOne({ _id: id });

    const filePath = path.join(UPLOADS_DIR, file.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.status(200).json({ message: "File deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
