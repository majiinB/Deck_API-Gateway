/**
 * Deck API - Moderation Service
 *
 * @file moderationService.js
 * @description Provides AI-based moderation services for flashcards.
 * 
 * This module interacts with AI models (Gemini) to moderate flashcards 
 * by checking for inappropriate content.
 * 
 * @module moderationService
 * 
 * @requires ../repositories/deckRepository.js - Handles deck data retrieval.
 * @requires ../services/aiService.js - Handles AI moderation requests.
 * 
 * @author Arthur M. Artugue
 * @created 2025-02-20
 * @updated 2025-02-22
 */
import { getDeckById } from "../repositories/deckRepository.js";
import { sendPromptInline } from "../services/aiService.js";
import { quizSchema } from "../schema/quizSchema.js";

/**
 * Performs AI-based moderation on a deck's flashcards.
 *
 * @async
 * @function geminiModerationService
 * @param {string} deckId - The ID of the deck to be moderated.
 * @param {string} id - A unique identifier for the moderation request.
 * @returns {Promise<Object>} The moderation results including flagged cards and overall verdict.
 */
export const geminiQuizService = async (deckId, id) => {
    const aiResponses = [];
    let tokenCount = 0;
    let statusCode = 200;
    let data = null;
    let message = "Moderation review successful";

    try {
        const deck = await getDeckById(deckId);
        const deckTermsAndDef = deck.questions;

        const deckData = formatPrompt(deckTermsAndDef);
        const prompt = quizPrompt(5);
        const result = await sendPromptInline(quizSchema, prompt, deckData);
        statusCode = 200;
        data = result;

    } catch (error) {
        message = "Moderation review failed: " + error.message
        data = null;

        if (error.message == "Deck not found") { statusCode = 404; }
        else if (error.message == "Deck has no valid questions") { statusCode = 404; }
        else { statusCode = 500; }
    }

    return {
        status: statusCode,
        request_owner_id: id,
        message: message,
        data: data
    }

}

/**
 * Splits an array into smaller chunks.
 *
 * @function chunkArray
 * @param {Array} array - The array to be split.
 * @param {number} chunkSize - The size of each chunk.
 * @returns {Array[]} An array of chunked arrays.
 */

/**
 * Formats a chunk of questions into a prompt-friendly format.
 *
 * @function formatPrompt
 * @param {Array} questionsChunk - The chunk of questions to format.
 * @returns {string} A formatted string for AI moderation.
 */
const formatPrompt = (questionsChunk) => {
    return questionsChunk.map(q => `ID: ${q.id}\nDescription: ${q.question}\nTerm: ${q.answer}`).join("\n\n");
};

/**
 * Generates a moderation prompt for the AI.
 *
 * @function moderationPrompt
 * @param {string} questionsChunk - A formatted chunk of questions.
 * @returns {string} A structured prompt for AI moderation.
 */
const quizPrompt = (number) => {
    const prompt = `You are an expert quiz generator. Based on the provided flashcards, create a well-balanced multiple-choice quiz.
                    Each question should assess understanding of the terms and definitions given. Ensure the following:

                    - The questions must be clear, relevant, and derived from the flashcard content.
                    - Each question must have four answer choices, with only one correct answer.
                    - Distractor choices should be plausible but incorrect.
                    - Avoid repeating the exact wording of the term/definition; instead, rephrase to encourage critical thinking.
                    - Ensure a mix of direct recall, application-based, and conceptual questions.
                    - If the flashcard set is too small to generate a full quiz, return an error message instead.

                    ### Instructions:
                    1. Review each description-term pair.
                    2. Think of ${number} question and their corresponding choices.
                    3. Return your the quiz in the expected format and STRICTLY FOLLOW THE FORMAT.

                    ## Expected sample output format ##
                    Example 1:
                    {
                        "quiz": [
                            {
                                "question": "Which process allows plants to convert sunlight into energy?",
                                "related_flashcard_id": "HTALJDF134",
                                "choices": [
                                    { "text": "Photosynthesis", "is_correct": true },
                                    { "text": "Respiration", "is_correct": false },
                                    { "text": "Fermentation", "is_correct": false },
                                    { "text": "Transpiration", "is_correct": false }
                                ]
                            },
                            {
                                "question": "What is the primary result of mitosis?",
                                "related_flashcard_id": "LKNDALFK923",
                                "choices": [
                                    { "text": "Two identical daughter cells", "is_correct": true },
                                    { "text": "Four genetically unique cells", "is_correct": false },
                                    { "text": "A single large cell", "is_correct": false },
                                    { "text": "Cell death", "is_correct": false }
                                ]
                            }
                        ],
                        "errorMessage": null
                    }
        `;
    return prompt;
}
