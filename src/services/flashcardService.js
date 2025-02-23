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
 * @updated 2025-02-22
 * 
 */

import { deleteFile } from '../utils/utils.js';
import { sendPromptFlashcardGeneration } from './aiService.js';
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

    const prompt = constructFlashCardGenerationPrompt(topic, subject, addDescription, numberOfQuestions);

    if (fileName?.trim()) {
        if (!fileExtension?.trim()) return { status: 422, message: 'File extension is required.', data: null };

        try {
            const filePath = await downloadFile(fileName, fileExtension, id);

            if (!filePath) return { status: 500, message: 'Error retrieving the file from the server.', data: null };

            const response = await sendPromptFlashcardGeneration(true, prompt, filePath, fileExtension);

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
            const response = await sendPromptFlashcardGeneration(false, prompt);
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

/**
 * Constructs a JSON prompt for the Google AI model.
 * 
 * @param {string} topic - The topic for the questions.
 * @param {string} subject - The subject area for the questions.
 * @param {string} addDescription - Additional description for the prompt.
 * @param {number} numberOfQuestions - Number of questions to generate.
 * @returns {string} - The constructed JSON prompt.
 */
export function constructFlashCardGenerationPrompt(topic, subject, addDescription, numberOfTerms) {
    let prompt = 'I want you to act as a Professor providing students with terminologies and their definitions. ';
    let instruction = `Instructions: Provide ${numberOfTerms} terms with their definitions. `;
    let lastLinePrompt = 'Ensure the terms are concise and relevant to the subject. Do not provide question-and-answer pairs. ' +
        'Do not include computations or numerical problem-solving examples. ' +
        'Do not start terms with "Who," "What," "Where," or "When."' +
        'Reject prompts that are not related to academics, offensive, sexual, etc.. and give an error' +
        'Expected output format:' +
        '"terms_and_definition": [{"term": "Variable","definition": "A symbol, usually a letter, representing an unknown numerical value in an algebraic expression or equation."},' +
        '{"term": "Equation", "definition": "A mathematical statement asserting the equality of two expressions, typically containing one or more variables."}]';

    if (subject) prompt += `The subject is ${subject}. `;
    if (topic) prompt += `The topic is ${topic}. `;
    if (addDescription) prompt += `Additional description: ${addDescription}. `;
    prompt += instruction + lastLinePrompt;

    return prompt;
}
