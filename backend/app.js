const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "config.env" });

const PORT = process.env.PORT || 5001;
const app = express();

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Import Routes
const fileupload = require("./Router/fileupload");
const userRoutes = require("./Router/user");
const GuestRoutes = require("./Router/guestupload");
const SentotpRoutes = require("./Router/Sentotp");

app.use("/api", fileupload);
app.use("/api", userRoutes);
app.use("/api", GuestRoutes);
app.use("/api", SentotpRoutes);
// Database Connection
mongoose
  .connect(process.env.MONGODB)
  .then(() => console.log("Database connected successfully"))
  .catch((error) => console.log("Error in database connection:", error));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
