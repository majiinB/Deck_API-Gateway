/**
 * Deck API - Moderation Controller
 * 
 * @file moderationController.js
 * @description Handles AI prompt requests for Gemini and OpenAI.
 * 
 * This module provides controllers for processing AI-generated flashcard prompts. 
 * It validates user input and interacts with the respective AI services.
 * 
 * @module moderationController
 * 
 * @requires ../services/flashcardService.js
 * @requires ../utils/utils.js
 * 
 * @author Arthur M. Artugue
 * @created 2025-02-20
 * @updated 2025-02-20
 */

import { geminiModerationService } from '../services/moderationService.js';
export const geminiModerationController = async (req, res) => {
    const { deckId } = req.body;
    const userId = req.param.id;

    if (!deckId.trim()) {
        return res.status(400).json({ message: 'Subject or topic is required if no file is uploaded.' });
    }

    const result = await geminiModerationService(deckId, userId);
    return res.status(200).send(result);
}