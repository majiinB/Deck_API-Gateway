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
 * @requires ../services/flashcardService.js
 * @requires ../utils/utils.js
 * 
 * @author Arthur M. Artugue
 * @created 2025-02-12
 * @updated 2025-02-20
 */

import { geminiFlashcardService } from '../services/flashcardService.js';
import { isValidInteger } from '../utils/utils.js';

/**
 * Handles AI prompt requests using Gemini AI.
 * 
 * @async
 * @function geminiFlashcardController
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response with generated prompts or an error message.
 */
export const geminiFlashcardController = async (req, res) => {
    const { subject, topic, fileName, numberOfQuestions, deckTitle } = req.body;

    // Validate input: Either file or both subject and topic are required
    if (!fileName?.trim() && (!subject?.trim() || !topic?.trim())) {
        return res.status(400).json({ message: 'Subject or topic is required if no file is uploaded.' });
    }

    if (!deckTitle?.trim()) {
        return res.status(400).json({ message: 'Subject or topic is required if no file is uploaded.' });
    }

    // Validate the number of questions
    if (!isValidInteger(numberOfQuestions)) {
        return res.status(422).json({ message: 'Invalid number of questions. It must be between 2 and 20.' });
    }

    const result = await geminiFlashcardService(req, req.params.id);
    return res.status(result.status).json(result)
}
