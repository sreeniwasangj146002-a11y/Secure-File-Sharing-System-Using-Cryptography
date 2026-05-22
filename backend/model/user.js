

// const mongoose = require("mongoose");

// // Define User Schema
// const userSchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true }, // Password should be hashed
//     role: { type: String, enum: ["user", "admin"], default: "user" },
//     sharedfilecount: { type: String },
//     fileCount: { type: Number, default: 0 }, // 🆕 Automatically tracks file uploads
//     otp: {
//         code: { type: String },
//         expiresAt: { type: Date },
//       },
// });

// //  Method to update the file count
// userSchema.methods.updateFileCount = async function () {
//     try {
//         const File = mongoose.model("File"); // Reference to the File model
//         const fileCount = await File.countDocuments({ userId: this._id });
//         this.fileCount = fileCount;
//         await this.save();
//     } catch (error) {
//         console.error("Error updating file count:", error.message);
//     }
// };

// module.exports = mongoose.model("User", userSchema);


const mongoose = require("mongoose");

// Define User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Password should be hashed in production
  role: { type: String, enum: ["user", "admin"], default: "user" },
  sharedfilecount: { type: String },
  fileCount: { type: Number, default: 0 }, // Automatically tracks file uploads
  otp: {
    code: { type: String },
    expiresAt: { type: Date },
    resetToken: { type: String },
    verified: { type: Boolean, default: false },
  },
});

// Method to update the file count
userSchema.methods.updateFileCount = async function () {
  try {
    const File = mongoose.model("File"); // Reference to the File model
    const fileCount = await File.countDocuments({ userId: this._id });
    this.fileCount = fileCount;
    await this.save();
  } catch (error) {
    console.error("Error updating file count:", error.message);
  }
};

module.exports = mongoose.model("User", userSchema);
