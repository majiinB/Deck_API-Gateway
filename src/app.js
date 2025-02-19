/**
 * Deck API
 * 
 * @file app.js
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
 * - Listens on port 3000. (Depending on env configuration)
 * 
 * To start the server, run this file. The server will listen on the specified port.
 * 
 * @module app
 * 
 * @author Arthur M. Artugue
 * @created 2024-06-10
 * @updated 2025-02-19
 */

import express from 'express';
import messageRoute from './routes/promptRoute.js';
import responseRoute from './routes/responseRoute.js';

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
    res.status(422).json({
        error: 'Unprocessable Entity, check your request data'
    });
}

const app = express();

// MIDDLEWARE
/*
 * To parse and read body to json
 */
app.use(express.json());
app.use(errorHandler);

//END POINTS
app.use('/prompt', messageRoute);

// Used for openAI, uncomment if will be used 
// app.use('/response', responseRoute);

app.get('/hi', async (req, res) => {
    console.log('someone said hi');
    return res.status(200).send('Hello I\'m Online!');
});

export default app;

