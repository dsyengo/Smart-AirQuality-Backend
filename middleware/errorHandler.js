export function errorHandler(err, req, res, next) {
    // Log error details to the console.
    console.error('Error occurred:', err);

    // Optionally, you can add additional logging or error processing here.
    // Return a 500 Internal Server Error to the client.
    res.status(500).json({
        message: 'Internal Server Error'
    });
}