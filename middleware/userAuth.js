import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { asyncWrapper } from "../utils/asyncWrapper.js"
import ErrorResponse from "../utils/errorResponse.js"

export const userAuth = async (req, res, next) => {
    try {
        let token;

        // Prefer Authorization header over cookies for mobile compatibility
        if (req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        } else if (req.cookies?.token) {
            token = req.cookies.token;
        }

        // No token found
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized. Please login.",
            });
        }

        // Verify and decode token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach userId to request object
        req.user = { userId: decoded.id };  // Use req.user, not req.body

        console.log("User ID from token:", req.user.userId);

        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error.message);
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token.",
        });
    }
};
