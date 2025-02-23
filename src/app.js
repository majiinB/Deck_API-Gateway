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
import flashcardRoute from './routes/flashcardRoute.js';
import moderationRoute from './routes/moderationRoute.js'
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { getDeckById } from './repositories/deckRepository.js';

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
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ message: 'CORS policy blocked this request' });
    } else {
        res.status(422).json({
            error: 'Unprocessable Entity, check your request data'
        });
    }
}

const corsOptions = {
    origin: (origin, callback) => {
        console.log(`CORS Request from: ${origin}`);
        const allowedOrigins = ['https://frontend.com'];
        if (origin && allowedOrigins.includes(origin)) {
            callback(null, true); // Allow request
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // Limit each IP to n requests per windowMs
    message: { message: "Too many requests, please try again later." },
    headers: true, // Send `X-RateLimit-*` headers
});

const app = express();

// MIDDLEWARE
/*
 * To parse and read body to json
 */
app.use(cors(corsOptions));
app.use(limiter);
app.use(express.json());
app.use(errorHandler);

//END POINTS
app.use('/v2/deck', flashcardRoute);
app.use('/v2/deck', moderationRoute);

app.get('/v2/deck/hi', async (req, res) => {
    console.log('someone said hi');
    return res.status(200).json({ message: 'Hi! the server is active' });
});

export default app;

