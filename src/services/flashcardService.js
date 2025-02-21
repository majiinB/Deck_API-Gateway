/**
 * Deck API - Prompt Service
 *
 * @file flashcardService.js
 * @description Provides services for processing AI-generated flashcard prompts.
 * 
 * This module interacts with AI models (Gemini and OpenAI) to generate flashcards based on user input.
 * It handles file retrieval, prompt construction, and API communication.
 * 
 * @module flashcardService
 * 
 * @requires ../utils/utils.js
 * @requires ../services/aiService.js
 * @requires ../repositories/fileRepository.js
 * 
 * @author Arthur M. Artugue
 * @created 2025-02-12
 * @updated 2025-02-20
 * 
 */

import { createThread, extractPdfText, deleteFile } from '../utils/utils.js';
import { sendPrompt, constructGoogleAIPrompt } from './aiService.js';
import { downloadFile, downloadPdf } from "../repositories/fileRepository.js";

/**
 * Generates AI-generated flashcards using Gemini.
 *
 * @async
 * @function geminiFlashcardService
 * @param {Object} request - The HTTP request object.
 * @param {string} id - The request owner ID.
 * @returns {Promise<Object>} Response object containing the generated flashcards or error message.
 */
export const geminiFlashcardService = async (request, id) => {
    const { subject, topic, addDescription, fileName, fileExtension, numberOfQuestions } = request.body;

    const prompt = constructGoogleAIPrompt(topic, subject, addDescription, numberOfQuestions);

    if (fileName?.trim()) {
        if (!fileExtension?.trim()) return { status: 422, message: 'File extension is required.', data: null };

        try {
            const filePath = await downloadFile(fileName, fileExtension, id);

            if (!filePath) return { status: 500, message: 'Error retrieving the file from the server.', data: null };

            const response = await sendPrompt(true, prompt, filePath, fileExtension);

            return {
                status: 200,
                request_owner_id: id,
                message: response.message,
                data: response
            };
        } catch (error) {
            return {
                status: 500,
                request_owner_id: id,
                message: 'An Error has occured while sending information to AI.',
                data: null
            };
        } finally {
            deleteFile(filePath);
        }
    } else {
        try {
            const response = await sendPrompt(false, prompt);
            return {
                status: 200,
                request_owner_id: id,
                message: response.message,
                data: response.data
            };
        } catch (error) {
            console.error('Error during file retrieval:', error);
            return {
                status: 500,
                request_owner_id: id,
                message: 'An Error has occured and while retrieving response from AI',
                data: null
            };
        }
    }
}
