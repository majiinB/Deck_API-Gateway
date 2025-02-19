/**
 * Deck API - Prompt Service
 *
 * @file promptService.js
 * @description Provides services for processing AI-generated flashcard prompts.
 * 
 * This module interacts with AI models (Gemini and OpenAI) to generate flashcards based on user input.
 * It handles file retrieval, prompt construction, and API communication.
 * 
 * @module promptService
 * 
 * @requires ../config/openaiConfig.js
 * @requires ../utils/utils.js
 * @requires ../services/aiService.js
 * @requires ../repositories/fileRepository.js
 * 
 * @author Arthur M. Artugue
 * @created 2025-02-12
 * @updated 2025-02-19
 * 
 */

import openai from "../config/openaiConfig.js";
import { createThread, extractPdfText, deleteFile, isValidInteger } from '../utils/utils.js';
import { sendPrompt, constructGoogleAIPrompt } from '../services/aiService.js';
import { downloadFile, downloadPdf } from "../repositories/fileRepository.js";

/**
 * Generates AI-generated flashcards using Gemini.
 *
 * @async
 * @function promptGeminiService
 * @param {Object} request - The HTTP request object.
 * @param {string} id - The request owner ID.
 * @returns {Promise<Object>} Response object containing the generated flashcards or error message.
 */
export const promptGeminiService = async (request, id) => {
    const { subject, topic, addDescription, fileName, fileExtension, numberOfQuestions } = request.body;

    console.log("log id" + id);


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

/**
 * Generates AI-generated flashcards using OpenAI.
 *
 * @async
 * @function promptOpenAI
 * @param {Object} request - The HTTP request object.
 * @returns {Promise<Object>} Response object containing the generated flashcards or error message.
 */
export const promptOpenAI = async (request) => {
    const { subject, topic, addDescription, pdfFileName, numberOfQuestions, isNewMessage, threadID } = request.body;
    let prompt = `Instructions: give me ${numberOfQuestions} questions with answers.`;
    let pdfInfo = 'Source of information to use:';
    let lastLinePrompt = 'Do not repeat questions. Keep questions 1-2 sentences and answers 1 sentence or keypoint only.';

    // Extract text from PDF if provided
    if (pdfFileName) {
        try {
            const filePath = await downloadPdf(pdfFileName, id);
            const extractedText = await extractPdfText(filePath);

            if (!extractedText) {
                return { status: 421, message: 'PDF extraction failed. Please use a valid PDF file.' };
            }

            if (!deleteFile(filePath)) {
                return { status: 422, message: 'PDF deletion failed on the server.' };
            }

            pdfInfo += extractedText;
        } catch (error) {
            console.error('Error extracting PDF text:', error);
            return { status: 501, message: 'Error during PDF text extraction.' };
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
            return { status: 423, message: 'Subject and topic are required if no PDF is uploaded.' };
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

        return {
            status: 200,
            data: {
                thread_id: run.thread_id,
                run_id: run.id
            }
        };
    } catch (error) {
        console.error('Error processing the OpenAI request:', error);
        return { status: 424, message: 'Error processing the message route.' };
    }
};
