const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const Sendotp = require("../model/sendotp");
// const sendotp = require("../model/sendotp");

const File = require('../model/fileupload')

//  Email Configuration 
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});


router.post("/sendotp", async (req, res) => {
    try {
        const { email, filename } = req.body;
        if (!email || !filename) return res.status(400).json({ message: "Email and filename are required." });

        const expiryTime = new Date(Date.now() + 60 * 1000); // 1 minute expiry (changed from 40s)

        // Store expiry timestamp in database
        await Sendotp.findOneAndUpdate(
            { email, filename },
            { expiresAt: expiryTime, verified: false, otp: null },
            { upsert: true, new: true }
        );

        await File.findOneAndUpdate(
            { filename }, // Match only by filename
            { recivermail: email },
            { new: true } // Optional: returns the updated document
        );
        

        const link = `http://localhost:5001/api/generateotp?email=${encodeURIComponent(email)}&filename=${encodeURIComponent(filename)}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "File Download Link",
            html: `<p>Click <a href="${link}">here</a> to proceed with file download. This link expires in 1 minute.</p>`,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Initial link sent successfully." });

    } catch (error) {
        console.error("Error sending initial link:", error);
        res.status(500).json({ message: "Error sending initial link." });
    }
});

router.put("/update-expiry/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { expiryTime_default } = req.body;

        console.log("Received:", req.body);

        const updatedFile = await File.findByIdAndUpdate(
            id,
            { expiryTime_default },
            { new: true }
        );

        if (!updatedFile) {
            return res.status(404).json({ message: "File not found" });
        }

        res.status(200).json({ message: "Expiry time updated", data: updatedFile });
    } catch (error) {
        console.error("Error updating expiryTime_default:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/generateotp", async (req, res) => {
    try {
        const { email, filename } = req.query;
        if (!email || !filename) return res.status(400).send("Invalid request.");

        const now = new Date();

        // Check if the link is expired (1 minute validity)
        const otpRecord = await Sendotp.findOne({ email, filename });
        if (!otpRecord || now > otpRecord.expiresAt) {
            return res.status(400).send(`
                <html>
                    <head><title>Link Expired</title></head>
                    <body>
                        <h2>❌ This link has expired (valid for 1 minute only)</h2>
                        <p>Please request a new download link.</p>
                    </body>
                </html>
            `);
        }

        // Generate new OTP (don't reuse old ones for security)
        const otp = crypto.randomInt(100000, 999999).toString();
        await Sendotp.findOneAndUpdate(
            { email, filename },
            { otp, verified: false, createdAt: new Date(), $inc: { sharedCounts: 1 } },
            { new: true }
        );

        // Send OTP Email
        const verifyLink = `http://localhost:5001/api/verifyotp?email=${encodeURIComponent(email)}&filename=${encodeURIComponent(filename)}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your OTP Code",
            html: `<p>Your OTP is: <strong>${otp}</strong></p>
                   <p>Click <a href="${verifyLink}">here</a> to verify and download the file.</p>
                   <p>Note: This OTP is valid for 5 minutes.</p>`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).send(`
            <html>
                <head>
                    <title>OTP Sent</title>
                    <style>
                        body { display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif; }
                        .message-box { background: white; padding: 20px; border-radius: 10px; box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1); text-align: center; }
                        .success { color: green; font-size: 20px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="message-box">
                        <p class="success">✅ OTP Sent Successfully!</p>
                        <p>Please check your email for the OTP.</p>
                        <p>Time left to use this link: ${Math.floor((otpRecord.expiresAt - now) / 1000)} seconds</p>
                    </div>
                </body>
            </html>
        `);

    } catch (error) {
        console.error("Error generating OTP:", error);
        res.status(500).send("An error occurred.");
    }
});

router.get("/get_data", async (req, res) => {
    try {
        // Fetching data from the database
        const getData = await Sendotp.find({}, { otp: 0 }); // Excluding OTP for security

        if (!getData.length) {
            return res.status(404).json({ message: "No data found" });
        }

        res.status(200).json(getData);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


// Render OTP Verification Form
router.get("/verifyotp", async (req, res) => {
    try {
        const { email, filename } = req.query;
        if (!email || !filename) return res.status(400).send("Invalid request.");

        // Check for existing OTP
        const otpRecord = await Sendotp.findOne({ email, filename });

        res.send(`
            <html>
            <head>
                <title>Verify OTP</title>
                <style>
                    body {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background-color: #f4f4f4;
                        font-family: Arial, sans-serif;
                    }
                    .container {
                        background: white;
                        padding: 20px;
                        border-radius: 10px;
                        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
                        text-align: center;
                        width: 300px;
                    }
                    input, button {
                        width: 100%;
                        padding: 10px;
                        margin: 10px 0;
                        border: 1px solid #ccc;
                        border-radius: 5px;
                    }
                    button {
                        background: #007bff;
                        color: white;
                        cursor: pointer;
                    }
                    button:hover { background: #0056b3; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Enter OTP for File Download</h2>
                    <form method="POST" action="/api/validateotp">
                        <input type="text" name="email" value="${email}" />
                        <input type="text" name="filename" value="${filename}" />
                        <input type="text" name="otp" placeholder="Enter OTP" required />
                        <button type="submit">Validate OTP</button>
                    </form>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).send("An unexpected error occurred.");
    }
});

// Validate OTP and Show Download Button
router.post("/validateotp", async (req, res) => {
    try {
        const { email, filename, otp } = req.body;

        const otpRecord = await Sendotp.findOne({ email, filename });
        if (!otpRecord || otpRecord.otp !== otp) {
            return res.status(400).send("Invalid or incorrect OTP.");
        }

        otpRecord.verified = true;
        await otpRecord.save();

        res.send(`
            <html>
            <head>
                <title>OTP Verified</title>
                <style>
                    body {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background-color: #f4f4f4;
                        font-family: Arial, sans-serif;
                    }
                    .container {
                        background: white;
                        padding: 20px;
                        border-radius: 10px;
                        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
                        text-align: center;
                        width: 300px;
                    }
                    button {
                        width: 100%;
                        padding: 10px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        margin-top: 10px;
                    }
                    button:hover { background: #0056b3; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>✅ OTP Verified Successfully!</h2>
                    <form method="POST" action="/api/downloadfile">
                        <input type="hidden" name="filename" value="${encodeURIComponent(filename)}" />
                        <button type="submit">Download File</button>
                    </form>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).send("An unexpected error occurred.");
    }
});
    

// router.post("/downloadfile", async (req, res) => {
//     try {
//         const { filename } = req.body;
//         if (!filename) return res.status(400).send("Filename is required.");
// console.log("this is file data ",filename)
//         const filePath = path.join(__dirname, "../uploads", filename);
//         if (!fs.existsSync(filePath)) return res.status(404).send("File not found.");

//         // Check if the request is still valid by looking up the OTP verification time
//         const otpRecord = await Sendotp.findOne({ filename });
//         if (!otpRecord || !otpRecord.verified) {
//             return res.status(403).send("Verification required before accessing file.");
//         }

//         const expiryTime = new Date(Date.now() + 10 * 1000); // 10 seconds from now
//         const formattedExpiryTime = expiryTime.toLocaleTimeString(); // Output in HH:mm:ss format
//         console.log("Expiry Time:", formattedExpiryTime);
// //////////////

// const fileData = await File.findOne({ filename });

// if (!fileData) {
//     console.log("File not found.");
//     return res.status(404).send("File not found.");
// }

// // Log the expiry time
// console.log("Expiry Time:1212", fileData.expiryTime_default);

// // res.status(200).send("Check console for expiry time.");

//         // Get the current time
//         const now = new Date();
//         const nows = now.toLocaleTimeString(); // Current time in HH:mm:ss format
//         console.log(nows, "now");

//         // Create the default time (e.g., 11:05:45)
//         const defaultTime = new Date();
//         defaultTime.setHours(15, 37, 0, 0);   // Set the time to 11:05:45, keeping the current date
      
//         const date = new Date(defaultTime);
        
//         // Option 1: Simple readable format
//         console.log(date.toLocaleString(), "now");
//         // Compare the current time with the default time
//         if (now.getTime() >= defaultTime.getTime()) {
//             return res.status(410).send("Preview link has expired. Please request a new verification.");
//         }

router.post("/downloadfile", async (req, res) => {
    try {
        const { filename } = req.body;
        if (!filename) return res.status(400).send("Filename is required.");

        console.log("Requested file:", filename);

        const filePath = path.join(__dirname, "../uploads", filename);
        if (!fs.existsSync(filePath)) return res.status(404).send("File not found.");

        // OTP verification check
        const otpRecord = await Sendotp.findOne({ filename });
        if (!otpRecord || !otpRecord.verified) {
            return res.status(403).send("Verification required before accessing file.");
        }

        // Fetch file data to check expiry
        const fileData = await File.findOne({ filename });
        if (!fileData) {
            console.log("File metadata not found.");
            return res.status(404).send("File not found.");
        }

        const expiryTime = new Date(Date.now() + 10 * 1000); // 10 seconds from now
                const formattedExpiryTime = expiryTime.toLocaleTimeString(); // Output in HH:mm:ss format
                console.log("Expiry Time:", formattedExpiryTime);

        const expiryTimelink = new Date(fileData.expiryTime_default);
        const now = new Date();

        console.log("Current Time:", now.toLocaleTimeString());
        console.log("File Expiry Time:", expiryTimelink.toLocaleTimeString());

        if (now >= expiryTimelink) {
            return res.status(410).send("Preview link has expired. Please request a new verification.");
        }


        // Update the status in the database
        await Sendotp.findOneAndUpdate(
            { filename },
            {
                downloaded: "Previewed",
                previewExpiry: expiryTime
            },
            { new: true }
        );

        // Get file extension to determine content type
        const ext = path.extname(filename).toLowerCase();

        // Map common file extensions to their MIME types
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.txt': 'text/plain',
            '.html': 'text/html',
            '.htm': 'text/html',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.mp4': 'video/mp4',
            '.mp3': 'audio/mpeg'
        };

        let contentType = mimeTypes[ext] || 'application/octet-stream';

        // Set headers for inline display
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

        // Calculate remaining time in seconds
        const remainingTimeMs = expiryTime.getTime() - now.getTime();
        const remainingTimeSec = Math.floor(remainingTimeMs / 1000);

        // For HTML/text files, we can wrap the content to enforce the timeout
        if (contentType === 'text/html' || contentType === 'text/plain') {
            // Read the file content
            const fileContent = fs.readFileSync(filePath, 'utf8');

            // Wrap HTML content with auto-close script
            const wrappedContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Preview: ${filename}</title>
                    <style>
                        #countdown {
                            position: fixed;
                            top: 10px;
                            right: 10px;
                            background: rgba(0,0,0,0.7);
                            color: white;
                            padding: 5px 10px;
                            border-radius: 5px;
                            z-index: 9999;
                        }
                        #content {
                            margin-top: 40px;
                        }
                    </style>
                    <script>
                        // Set the expiration time
                        const expiryTime = new Date(${expiryTime.getTime()});
                        
                        function updateCountdown() {
                            const now = new Date();
                            const timeLeft = Math.max(0, Math.floor((expiryTime - now) / 1000));
                            
                            const minutes = Math.floor(timeLeft / 60);
                            const seconds = timeLeft % 60;
                            
                            document.getElementById('countdown').innerText = 
                                'Preview expires in: ' + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
                            
                            if (timeLeft <= 0) {
                                document.body.innerHTML = '<h1>Preview has expired</h1><p>Please request a new verification to view this file again.</p>';
                                clearInterval(countdownInterval);
                            }
                        }
                        
                        window.onload = function() {
                            updateCountdown();
                            const countdownInterval = setInterval(updateCountdown, 1000);
                        }
                    </script>
                </head>
                <body>
                    <div id="countdown">Preview expires in: ${Math.floor(remainingTimeSec / 60)}:${(remainingTimeSec % 60).toString().padStart(2, '0')}</div>
                    <div id="content">
                        ${contentType === 'text/html' ? fileContent : `<pre>${fileContent}</pre>`}
                    </div>
                </body>
                </html>
            `;

            return res.send(wrappedContent);
        }
        // For non-HTML/text files, we need to provide a wrapper page
        else {
            // Stream file with Content-Type headers set
            const fileStream = fs.createReadStream(filePath);

            // For files like PDFs, images, etc. that will open directly in the browser,
            // we can't easily force them to close after expiry without a wrapper
            // The server-side check above will prevent access after expiry

            // Add header to prevent caching
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');

            fileStream.pipe(res);
        }

    } catch (error) {
        console.error("Error opening the file:", error);
        res.status(500).send("An unexpected error occurred.");
    }
});



// router.post("/downloadfile", async (req, res) => {
//     try {
//         const { filename } = req.body;
//         if (!filename) return res.status(400).send("Filename is required.");

//         const filePath = path.join(__dirname, "../uploads", filename);
//         if (!fs.existsSync(filePath)) return res.status(404).send("File not found.");

//         // Check if the request is still valid by looking up the OTP verification time
//         const otpRecord = await Sendotp.findOne({ filename });
//         if (!otpRecord || !otpRecord.verified) {
//             return res.status(403).send("Verification required before accessing file.");
//         }

//         // Set preview expiration time (2 minutes from verification)
//         const verificationTime = otpRecord.updatedAt || new Date(); // when the OTP was verified
//         // const expiryTime = new Date(verificationTime.getTime() + 2 * 60  * 1000); // 2 minutes after verification
//         // const expiryTime = new Date(verificationTime.getTime() + 2 * 24 * 60 * 60 * 1000);
//         const expiryTime = new Date(Date.now() + 15 * 1000);
//         const formattedTime = expiryTime.toLocaleTimeString(); // This will return a time in HH:mm:ss format
//         console.log(formattedTime);


//         const now = new Date();

//         if (now > expiryTime) {
//             return res.status(410).send("Preview link has expired. Please request a new verification.");
//         }

//         // Update the status in the database
//         await Sendotp.findOneAndUpdate(
//             { filename },
//             { 
//                 downloaded: "Previewed",
//                 previewExpiry: expiryTime
//             },
//             { new: true }
//         );

//         // Get file extension to determine content type
//         const ext = path.extname(filename).toLowerCase();

//         // Map common file extensions to their MIME types
//         const mimeTypes = {
//             '.pdf': 'application/pdf',
//             '.jpg': 'image/jpeg',
//             '.jpeg': 'image/jpeg',
//             '.png': 'image/png',
//             '.gif': 'image/gif',
//             '.txt': 'text/plain',
//             '.html': 'text/html',
//             '.htm': 'text/html',
//             '.doc': 'application/msword',
//             '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//             '.xls': 'application/vnd.ms-excel',
//             '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//             '.mp4': 'video/mp4',
//             '.mp3': 'audio/mpeg'
//         };

//         let contentType = mimeTypes[ext] || 'application/octet-stream';

//         // Set headers for inline display
//         res.setHeader('Content-Type', contentType);
//         res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

//         // Calculate remaining time in seconds
//         const remainingTimeMs = expiryTime.getTime() - now.getTime();
//         const remainingTimeSec = Math.floor(remainingTimeMs / 1000);

//         // For HTML/text files, we can wrap the content to enforce the timeout
//         if (contentType === 'text/html' || contentType === 'text/plain') {
//             // Read the file content
//             const fileContent = fs.readFileSync(filePath, 'utf8');

//             // Wrap HTML content with auto-close script
//             const wrappedContent = `
//                 <!DOCTYPE html>
//                 <html>
//                 <head>
//                     <title>Preview: ${filename}</title>
//                     <style>
//                         #countdown {
//                             position: fixed;
//                             top: 10px;
//                             right: 10px;
//                             background: rgba(0,0,0,0.7);
//                             color: white;
//                             padding: 5px 10px;
//                             border-radius: 5px;
//                             z-index: 9999;
//                         }
//                         #content {
//                             margin-top: 40px;
//                         }
//                     </style>
//                     <script>
//                         // Set the expiration time
//                         const expiryTime = new Date(${expiryTime.getTime()});

//                         function updateCountdown() {
//                             const now = new Date();
//                             const timeLeft = Math.max(0, Math.floor((expiryTime - now) / 1000));

//                             const minutes = Math.floor(timeLeft / 60);
//                             const seconds = timeLeft % 60;

//                             document.getElementById('countdown').innerText = 
//                                 'Preview expires in: ' + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;

//                             if (timeLeft <= 0) {
//                                 document.body.innerHTML = '<h1>Preview has expired</h1><p>Please request a new verification to view this file again.</p>';
//                                 clearInterval(countdownInterval);
//                             }
//                         }

//                         window.onload = function() {
//                             updateCountdown();
//                             const countdownInterval = setInterval(updateCountdown, 1000);
//                         }
//                     </script>
//                 </head>
//                 <body>
//                     <div id="countdown">Preview expires in: ${Math.floor(remainingTimeSec / 60)}:${(remainingTimeSec % 60).toString().padStart(2, '0')}</div>
//                     <div id="content">
//                         ${contentType === 'text/html' ? fileContent : `<pre>${fileContent}</pre>`}
//                     </div>
//                 </body>
//                 </html>
//             `;

//             return res.send(wrappedContent);
//         } 
//         // For non-HTML/text files, we need to provide a wrapper page
//         else {
//             // Stream file with Content-Type headers set
//             const fileStream = fs.createReadStream(filePath);

//             // For files like PDFs, images, etc. that will open directly in the browser,
//             // we can't easily force them to close after expiry without a wrapper
//             // The server-side check above will prevent access after expiry

//             // Add header to prevent caching
//             res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
//             res.setHeader('Pragma', 'no-cache');
//             res.setHeader('Expires', '0');

//             fileStream.pipe(res);
//         }

//     } catch (error) {
//         console.error("Error opening the file:", error);
//         res.status(500).send("An unexpected error occurred.");
//     }
// });

// Route to check if preview is still valid

// router.get("/checkpreview/:filename", async (req, res) => {
//     try {
//         const { filename } = req.params;

//         const otpRecord = await Sendotp.findOne({ filename });
//         if (!otpRecord || !otpRecord.previewExpiry) {
//             return res.status(404).json({ valid: false, message: "Preview not found" });
//         }

//         const now = new Date();
//         const isValid = now < new Date(otpRecord.previewExpiry);

//         res.json({
//             valid: isValid,
//             remainingTime: isValid ? Math.floor((new Date(otpRecord.previewExpiry) - now) / 1000) : 0
//         });

//     } catch (error) {
//         console.error("Error checking preview status:", error);
//         res.status(500).json({ valid: false, message: "Error checking preview status" });
//     }
// });
module.exports = router;
