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
import openai from '../config/openaiConfig.js';
import { delay } from '../functions/utils.js';

const router = express.Router();

/**
 * Route to retrieve messages from OpenAI threads.
 * @route GET /v1/openAI/:id
 * @param {string} id - The ID parameter passed in the URL.
 * @query {string} thread_id - The ID of the thread to retrieve.
 * @query {string} run_id - The ID of the thread's run to monitor.
 * @returns {JSON} - A list of parsed messages or an error message.
 */
router.get('/v1/openAI/:id', async (req, res) => {
    const { id } = req.params;
    const { thread_id, run_id } = req.query;
    const MAX_TRIES = 5;
    let status = 'queued';
    let tries = 0;

    // Retry loop to monitor the status of the run until it's 'completed' or the max tries are reached
    while (status !== 'completed' && tries < MAX_TRIES) {
        try {
            // Retrieve the current status of the thread's run
            let retrieve = await openai.beta.threads.runs.retrieve(thread_id, run_id);
            status = retrieve.status;
            tries++;

            // Add a delay before making the next retrieval attempt
            await delay(1500);
        } catch (error) {
            console.error(`Error retrieving status: ${error.message}`);
            return res.status(500).json({ error: 'Error retrieving run status.' });
        }
    }

    // If status is not 'completed' after max tries, return an error response
    if (status !== 'completed' && tries === MAX_TRIES) {
        return res.status(425).send({
            message: `An error occurred and your request is not completed. Please try again.\n
            Number of tries: ${tries}\nExpected status: completed\nCurrent status: ${status}`
        });
    }

    // If the status is 'completed', attempt to retrieve messages from the thread
    if (status === 'completed') {
        try {
            const response = await openai.beta.threads.messages.list(thread_id);

            const parsedMessages = [];
            const unparsedMessages = [];

            // Parse each message's content to JSON format
            response.body.data.forEach((message) => {
                const content = message.content[0]; // Assumes each message has only one content object
                if (content && content.type === 'text' && content.text && content.text.value) {
                    try {
                        const parsedContent = JSON.parse(content.text.value);
                        parsedMessages.push(parsedContent);
                    } catch (error) {
                        // If parsing fails, add the raw message to unparsedMessages
                        unparsedMessages.push(content.text.value);
                    }
                }
            });

            console.log('Unparsed messages:', unparsedMessages); // Debugging output

            // Send the parsed messages as a JSON response
            res.status(200).json(parsedMessages);

        } catch (error) {
            // Handle any errors during message retrieval or parsing
            console.error(`Error retrieving messages: ${error.message}`);
            res.status(502).json({ error: error.message });
        }
    }
});

// Placeholder for future route
// router.get('/v2/gemini/:id');

export default router;
