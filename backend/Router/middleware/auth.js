const jwt = require("jsonwebtoken");

const authMiddleware = (allowedRoles = []) => (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized. No token provided." });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded; // Attach user info to request (e.g., { id, role })

        // ✅ Role-based access control
        if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Insufficient permissions." });
        }

        next(); // Proceed to the next middleware/controller
    } catch (error) {
        console.error("JWT Authentication Error:", error.message);
        return res.status(401).json({ message: "Invalid or expired token." });
    }
};

module.exports = authMiddleware;
