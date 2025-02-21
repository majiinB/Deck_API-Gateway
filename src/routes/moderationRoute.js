/**
 * Deck API - Moderation Router
 *
 * @file moderationRoute.js
 * @description This module defines the routes for the Deck API, which interacts Gemini services 
 * to do AI-based moderation on flashcards. 
 *
 * Routes:
 * - /v2/gemini/:id: Handles requests through Gemini for doing AI-based deck content moderation.
 *
 * Middleware:
 * - express.json(): Parses incoming request bodies in JSON format.
 *
 * External Dependencies:
 * - Gemini: Configured Gemini instance for interacting with the Google Gemini API.
 * - Firebase: Firebase App initialization for configuration management.
 * 
 * @module router
 * 
 * @author Arthur M. Artugue
 * @created 2025-02-20
 * @updated 2025-02-22
 */

import express from 'express';
import { verifyFirebaseToken } from '../config/firebaseAdminConfig.js';
import { geminiModerationController } from '../controllers/moderationController.js';

const router = express.Router();

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
router.post('/v2/gemini/:id', geminiModerationController) // put verifyFirebaseToken as second parameter to enable jwt verification

export default router;
