/**
 * Deck API Router
 *
 * @file router.js
 * @description This module defines the routes for the Deck API, which interacts with OpenAI and Gemini services 
 * to generate AI-based questions, flashcards, and responses. It handles PDF downloads, text extraction, 
 * and prompt construction for various scenarios.
 *
 * Routes:
 * - /v1/openAI/:id: Handles AI prompt-related requests using OpenAI, with optional PDF input for content generation.
 * - /v2/gemini/:id: Handles requests through Gemini for generating content and flashcards with or without file input.
 *
 * Middleware:
 * - express.json(): Parses incoming request bodies in JSON format.
 *
 * External Dependencies:
 * - openai: Configured OpenAI instance for interacting with the OpenAI API.
 * - firebase: Firebase App initialization for configuration management.
 * - Utility functions: Includes helper functions like PDF download, extraction, and validation checks.
 *
 * Functions:
 * - createThread: Creates or retrieves a thread for OpenAI-based prompts.
 * - downloadPdf, extractPdfText, deleteFile: Handle PDF operations.
 * - isValidInteger: Validates if the input is a valid integer.
 * - constructGoogleAIPrompt, sendPrompt: Gemini-related prompt handling.
 *
 * Server:
 * - These routes are part of the Express application and integrate with the main server.
 *
 * @module router
 * 
 * @author Arthur M. Artugue
 * @created 2024-06-10
 * @updated 2024-10-26
 */


import express from 'express';
import openai, { assistant } from '../config/openaiConfig.js';
import { initializeApp } from 'firebase/app';
import { createThread, extractPdfText, downloadPdf, deleteFile, isValidInteger } from '../functions/utils.js';
import { sendPrompt, constructGoogleAIPrompt, downloadFile } from '../functions/gemini.utils.js';
import config from '../config/firebaseConfig.js';

const router = express.Router();

// Initialize Firebase app using provided configuration
initializeApp(config);

/**
 * Route: POST /v1/openAI/:id
 * Description: Handles requests to generate flashcard-like questions and answers using OpenAI. 
 * Supports input from PDF files or provided subject, topic, and description.
 * Parameters:
 *   - id: Unique identifier from the request URL
 * Request Body:
 *   - subject: Subject of the questions (optional if PDF is provided)
 *   - topic: Topic of the questions (optional if PDF is provided)
 *   - addDescription: Additional context or description (optional)
 *   - pdfFileName: Name of the uploaded PDF file (optional)
 *   - numberOfQuestions: Number of questions to generate (2-20)
 *   - isNewMessage: Boolean indicating if a new thread should be created
 *   - threadID: Existing thread ID (if not a new message)
 */
router.post('/v1/openAI/:id', async (req, res) => {
    const { id } = req.params;
    const { subject, topic, addDescription, pdfFileName, numberOfQuestions, isNewMessage, threadID } = req.body;

    // Validate input: Either PDF or both subject and topic are required
    if (!pdfFileName && (!subject || !topic)) {
        return res.status(418).send('We need a message');
    }

    // Validate isNewMessage as a boolean
    if (isNewMessage !== true && isNewMessage !== false) {
        return res.status(419).send('isNewMessage must be true or false');
    }

    // Validate the number of questions
    if (!isValidInteger(numberOfQuestions)) {
        return res.status(420).send('Invalid number of questions. It must be a number between 2 and 20.');
    }

    // Prepare the prompt and PDF info placeholders
    let prompt = `Instructions: give me ${numberOfQuestions} questions with answers.`;
    let pdfInfo = 'Source of information to use:';
    let lastLinePrompt = 'Do not repeat questions. Keep questions 1-2 sentences and answers 1 sentence or keypoint only.';

    // Extract text from PDF if provided
    if (pdfFileName) {
        try {
            const filePath = await downloadPdf(pdfFileName, id);
            const extractedText = await extractPdfText(filePath);

            if (!extractedText) {
                return res.status(421).send('PDF extraction failed. Please use a valid PDF file.');
            }

            if (!deleteFile(filePath)) {
                return res.status(422).send('PDF deletion failed on the server.');
            }

            pdfInfo += extractedText;
        } catch (error) {
            console.error('Error extracting PDF text:', error);
            return res.status(501).send('Error during PDF text extraction.');
        }
    }

    // Build the prompt based on input
    if (pdfFileName) {
        if (subject) prompt += ` The subject is ${subject}.`;
        if (topic) prompt += ` The topic is ${topic}.`;
        if (addDescription) prompt += ` Additional description: ${addDescription}.`;
        prompt += pdfInfo;
    } else {
        if (!subject || !topic) {
            return res.status(423).send('Subject and topic are required if no PDF is uploaded.');
        }
        if (subject) prompt += ` The subject is ${subject}.`;
        if (topic) prompt += ` The topic is ${topic}.`;
        if (addDescription) prompt += ` Additional description: ${addDescription}.`;
    }

    prompt += lastLinePrompt;

    try {
        const thread = await createThread(isNewMessage, threadID);
        await openai.beta.threads.messages.create(thread, { role: 'user', content: prompt });

        const run = await openai.beta.threads.runs.create(thread, {
            assistant_id: assistant.id,
            instructions: 'Act as a professor providing JSON-formatted Q&A. Return empty JSON if message is non-academic, vulgar, vague, or personal.'
        });

        return res.status(200).send({
            thread_id: run.thread_id,
            run_id: run.id
        });
    } catch (error) {
        return res.status(424).send('Error processing the message route.');
    }
});

/**
 * Route: POST /v2/gemini/:id
 * Description: Handles requests to generate questions using Google AI prompt construction. 
 * Supports both file-based and manual input.
 * Parameters:
 *   - id: Unique identifier from the request URL
 * Request Body:
 *   - subject: Subject of the questions (optional if file is provided)
 *   - topic: Topic of the questions (optional if file is provided)
 *   - addDescription: Additional context or description (optional)
 *   - fileName: Name of the uploaded file (optional)
 *   - fileExtension: File extension (e.g., pdf, txt)
 *   - numberOfQuestions: Number of questions to generate (2-20)
 */
router.post('/v2/gemini/:id', async (req, res) => {
    const { id } = req.params;
    const { subject, topic, addDescription, fileName, fileExtension, numberOfQuestions } = req.body;
    let response;

    // Validate input: Either file or both subject and topic are required
    if (!fileName && (!subject || !topic)) {
        return res.status(400).send('Subject or topic is required if no file is uploaded.');
    }

    // Validate the number of questions
    if (!isValidInteger(numberOfQuestions)) {
        return res.status(422).send('Invalid number of questions. It must be between 2 and 20.');
    }

    const prompt = constructGoogleAIPrompt(topic, subject, addDescription, numberOfQuestions);

    if (fileName) {
        if (!fileExtension) {
            return res.status(422).send('File extension is required.');
        }

        try {
            const filePath = await downloadFile(fileName, fileExtension, id);

            if (!filePath) {
                return res.status(500).send('Error retrieving the file from the server.');
            }

            response = await sendPrompt(true, prompt, filePath, fileExtension);
            deleteFile(filePath);

            return res.status(200).json(response);
        } catch (error) {
            console.error('Error during file retrieval:', error);
            return res.status(500).send('Error retrieving the file from the server.');
        }
    } else {
        response = await sendPrompt(false, prompt);
        return res.status(200).json(response);
    }
});

export default router;
