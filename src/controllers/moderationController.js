/**
 * Deck API - Moderation Controller
 * 
 * @file moderationController.js
 * @description Handles AI moderation requests using Gemini AI.
 * 
 * This module provides controllers for processing AI-based moderation requests. 
 * It validates user input and interacts with the respective AI services.
 * 
 * @module moderationController
 * 
 * @requires ../services/moderationService.js
 * 
 * @author Arthur M. Artugue
 * @created 2025-02-20
 * @updated 2025-02-22
 */

import { geminiModerationService } from '../services/moderationService.js';

export const geminiModerationController = async (req, res) => {
    const { deckId } = req.body;
    const userId = req.params.id;

    if (!deckId.trim()) {
        return res.status(400).json({ message: 'Subject or topic is required if no file is uploaded.' });
    }

    const result = await geminiModerationService(deckId, userId);

    if (result.data == null) {
        return res.status(400).send(result);
    }
    return res.status(200).send(result);
}