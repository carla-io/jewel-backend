const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];

            // Verify Token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;

            next();
        } catch (error) {
            return res.status(401).json({ message: "Not authorized, invalid token" });
        }
    } else {
        return res.status(401).json({ message: "Not authorized, no token" });
    }
};
