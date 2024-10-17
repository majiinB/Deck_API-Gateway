/**
 * Deck API
 * 
 * @file index.js
 * @description This is the main entry point for the Deck API. It sets up the Express application,
 * 
 * Routes:
 * - /prompt: Handles AI prompt-related requests.
 * - /response: Handles AI response-related requests.
 * - /hi: Handles requests that checks if the server or API is up.
 * 
 * Middleware:
 * - express.json(): Parses incoming request bodies in JSON format.
 * - errorHandler: Custom error handler middleware to log errors and return a 422 Unprocessable Entity response.
 * 
 * Functions:
 * - errorHandler: Middleware function for error handling.
 * 
 * Server:
 * - Listens on port 3000.
 * 
 * To start the server, run this file. The server will listen on the specified port.
 * 
 * @module index
 * 
 * @author Arthur M. Artugue
 * @created 2024-06-10
 * @updated 2024-10-12
 */

import express from 'express';
import messageRoute from './routes/promptRoute.js';
import responseRoute from './routes/responseRoute.js';

// INSTANTIATE OBJECTS AND REQUIREMENTS
const PORT = 3000;
const app = express();

/**
 * Error handler middleware.
 * Logs the error stack trace for debugging and returns a 422 Unprocessable Entity response.
 *
 * @param {Error} err - The error object.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {Function} next - The next middleware function.
 */
function errorHandler(err, req, res, next) {
    //console.error(err.stack); // Log the error stack trace for debugging
    res.status(422).json({
        error: 'Unprocessable Entity, check your request data'
    });
}

// MIDDLEWARE
/*
 * To parse and read body to json
 */
app.use(express.json());
app.use(errorHandler);

//END POINTS
app.use('/prompt', messageRoute);
app.use('/response', responseRoute);
app.get('/hi', async (req, res) => {
    console.log('someone said hi');
    return res.status(200).send('Hello I\'m Online!');
});

// FIRE UP THE API
app.listen(PORT, () => {
    console.log(`Deck API is now listening to http://localhost:${PORT}`);
})

