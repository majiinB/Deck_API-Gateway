/**
 * Deck API - Prompt Controller
 * 
 * @file promptController.js
 * @description Handles AI prompt requests for Gemini and OpenAI.
 * 
 * This module provides controllers for processing AI-generated flashcard prompts. 
 * It validates user input and interacts with the respective AI services.
 * 
 * @module promptController
 * 
 * @requires ../services/promptService.js
 * @requires ../utils/utils.js
 * 
 * @author Arthur M. Artugue
 * @created 2025-02-12
 * @updated 2025-02-19
 */

import { promptGeminiService, promptOpenAI } from '../services/promptService.js';
import { isValidInteger } from '../utils/utils.js';

/**
 * Handles AI prompt requests using Gemini AI.
 * 
 * @async
 * @function geminiPromptController
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response with generated prompts or an error message.
 */
export const geminiPromptController = async (req, res) => {
    const { subject, topic, fileName, numberOfQuestions } = req.body;

    // Validate input: Either file or both subject and topic are required
    if (!fileName?.trim() && (!subject?.trim() || !topic?.trim())) {
        return res.status(400).json({ message: 'Subject or topic is required if no file is uploaded.' });
    }

    // Validate the number of questions
    if (!isValidInteger(numberOfQuestions)) {
        return res.status(422).json({ message: 'Invalid number of questions. It must be between 2 and 20.' });
    }

    const result = await promptGeminiService(req, req.params.id);
    return res.status(result.status).json(result)
}

/**
 * Handles AI prompt requests using OpenAI.
 * 
 * @async
 * @function openAiPromptController
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response with generated prompts or an error message.
 */
export const openAiPromptController = async (req, res) => {
    const { subject, topic, pdfFileName, numberOfQuestions, isNewMessage } = req.body;

    // Validate input: Either PDF or both subject and topic are required
    if (!pdfFileName && (!subject || !topic)) {
        return res.status(400).send('We need a message');
    }

    // Validate isNewMessage as a boolean
    if (isNewMessage !== true && isNewMessage !== false) {
        return res.status(400).send('isNewMessage must be true or false');
    }

    // Validate the number of questions
    if (!isValidInteger(numberOfQuestions)) {
        return res.status(420).send('Invalid number of questions. It must be a number between 2 and 20.');
    }

    const result = await promptOpenAI(req);

    if (result.data) {
        return res.status(result.status).json(result.data);
    } else {
        return res.status(result.status).send(result.message);
    }

}