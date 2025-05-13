import ErrorResponse from "../utils/errorResponse.js";

const errorHandler = (err, req, res, next) => {
    // Safeguard: Ensure that `err` is always an object and has a message
    if (!err || typeof err !== 'object') {
        err = new Error("Server Error");
        err.statusCode = 500;
    }

    // Create a shallow copy of the error
    let error = { ...err };
    error.message = err.message || "Server Error"; // Fallback message

    // Log to console for debugging
    console.error(err); // Use console.error for error logging

    // Handle Mongoose bad ObjectId error
    if (err.name === "CastError") {
        const message = `Resource not found`;
        error = new ErrorResponse(message, 404);
    }

    // Handle Mongoose duplicate key error
    if (err.code === 11000) {
        const message = "Duplicate field value entered";
        error = new ErrorResponse(message, 400);
    }

    // Handle Mongoose validation errors
    if (err.name === "ValidationError") {
        const message = Object.values(err.errors).map((val) => val.message).join(', ');
        error = new ErrorResponse(message, 400);
    }

    // Send the error response with a fallback for statusCode
    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
    });

    // Ensure the next middleware is called
    next();
};

export default errorHandler;
