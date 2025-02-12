/**
 * OpenAI Response Router
 *
 * @file responseRoute.js
 * @description This module defines the routes for interacting with the OpenAI API. It manages the retrieval of 
 * thread run statuses with retry logic and fetches messages upon successful completion. This router ensures 
 * robust interaction by validating responses and handling errors gracefully.
 *
 * Routes:
 * - GET /v1/openAI/:id: Retrieves the status of a thread's run from OpenAI with retries and returns parsed messages if successful.
 * - Placeholder: /v2/gemini/:id: Reserved for future Gemini API integration.
 *
 * Middleware:
 * - express.json(): Parses incoming request bodies in JSON format.
 *
 * External Dependencies:
 * - openai: Configured OpenAI instance for interacting with the OpenAI API.
 * - utils.js: Utility functions like `delay` for adding asynchronous pauses.
 *
 * Functions:
 * - delay: Adds a delay between retries to prevent rapid API calls.
 * - Retrieve Status: Monitors thread run status with a maximum retry limit.
 * - Message Retrieval and Parsing: Extracts and parses messages into JSON format for valid content.
 *
 * Server:
 * - This route integrates with the main Express server and handles AI-based communication workflows.
 *
 * @module responseRoute
 * 
 * @author Arthur M. Artugue
 * @created 2024-06-10
 * @updated 2024-02-11
 */


import express from 'express';
import { openAiResponseControllers } from '../controllers/responseController.js';

const router = express.Router();

/**
 * Route to retrieve messages from OpenAI threads.
 * @route GET /v1/openAI/:id
 * @param {string} id - The ID parameter passed in the URL.
 * @query {string} thread_id - The ID of the thread to retrieve.
 * @query {string} run_id - The ID of the thread's run to monitor.
 * @returns {JSON} - A list of parsed messages or an error message.
 */
router.get('/v1/openAI/:id', openAiResponseControllers);

// Placeholder for future route
// router.get('/v2/gemini/:id');

export default router;
