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
 * @updated 2025-03-05
 */
import { getDeckById, getDeckAndCheckField, updateDeck, getNewFlashcards } from "../repositories/deckRepository.js";
import { sendPromptInline } from "../services/aiService.js";
import { quizSchema } from "../schema/quizSchema.js";
import { createQuizForDeck, createQuestionAndAnswer, getQuizByDeckIDAndQuizType } from "../repositories/quizRepository.js";
import { timeStamp } from "../config/firebaseAdminConfig.js";

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
    const batchSize = 20;
    let quizId = "";
    let tokenCount = 0;
    let statusCode = 200;
    let data = null;
    let message = `Quiz creation for deck with id:${deckId} is successful`;

    try {
        // Check if the deck was already made to a quiz and when was the last time the deck was updated
        const deckInfo = await getDeckAndCheckField(deckId, "made_to_quiz_at"); 
        
        // Retrieves the quiz related to the provided deck ID
        const quizzes = await getQuizByDeckIDAndQuizType(deckId, 'multiple-choice');
        if (quizzes.length > 0) {
            quizId = quizzes[0].id;
            console.log("Quiz ID:", quizId);
        } else {
            console.log("No quiz found for this deck and quiz type.");
        }

        /** Check if the following conditions are true
         * - The deck should exist
         * - The deck shoul not have a 'made_to_quiz_at' field
         * - There should be no quiz document in the quiz collection related to the deck ID
         * */ 
        if(deckInfo.exists && !deckInfo.field_exists && (quizzes.length == 0)){
            /**
             * This block is for when the given deck doesn't have any quiz in the 'quiz' collection
             * The deck still has no quiz made for it
             */
            
            // Retrieve and process deck data to be passed to the AI
            const deck = await getDeckById(deckId);
            const deckTermsAndDef = deck.questions;
            
            // Retrieve and process results that will be stored in the database ( 'quiz' collection )
            quizId = await createQuizForDeck({
                associated_deck_id: deckId,
                created_at: timeStamp,
                is_deleted: false,
                quiz_type: "multiple-choice",
                updated_at:  timeStamp,
            });

            for (let i = 0; i < deckTermsAndDef.length; i += batchSize) {
                console.log(`From ${i} to ${i+batchSize}`);
                const batch = deckTermsAndDef.slice(i, i + batchSize);
                const prompt = quizPrompt(batch.length);
                const result = await sendPromptInline(quizSchema, prompt, formatData(batch));
                
                const questionAndAnswer = result.quiz_data.quiz;
                await createQuestionAndAnswer(quizId, questionAndAnswer);
            }
            
            // Update Deck information ( add the following fields to the deck: made_to_quiz_at, upgrade_at)
            await updateDeck(deckId, {made_to_quiz_at: timeStamp});

            // Assign data to be returned
            statusCode = 200;
            data = {quizId: quizId}
            
        }else{
            /**
             * This block is for when the given deck already has a quiz in the 'quiz' collection
             */

            // Retrieve new flashcards if there is any
            const newFlashcards = await getNewFlashcards(deckId);
            const numOfNewFlashCards = newFlashcards.length;

            if(numOfNewFlashCards > 0){
                
                for (let i = 0; i < newFlashcards.length; i += batchSize) {
                    const batch = newFlashcards.slice(i, i + batchSize);
                    const prompt = quizPrompt(batch.length);
                    const result = await sendPromptInline(quizSchema, prompt, formatData(batch));
                    
                    const questionAndAnswer = result.quiz_data.quiz;
                    await createQuestionAndAnswer(quizId, questionAndAnswer);
                }

                statusCode = 200;
                data = {no_of_new_flashcards: numOfNewFlashCards}
                message = `Quiz creation for new flashcards in deck ${deckId} is successful`
            } else{
                statusCode = 200;
                data = {quiz_id: quizId};
                message = `There is already a quiz made for this deck in the 'quiz' collection`
            }
        }
    } catch (error) {
        message = "Quiz creation failed: " + error.message
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
 * Formats a chunk of questions into a prompt-friendly format.
 *
 * @function formatData
 * @param {Array} questionsChunk - The chunk of questions to format.
 * @returns {string} A formatted string for AI moderation.
 */
const formatData = (questionsChunk) => {
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
    Each question should assess understanding of the terms and definitions given. Follow these strict requirements:

    - Number of Questions: Generate exactly ${number} questions. Do not return more or fewer.
    - Question Quality: Each question must be clear, relevant, and derived from the flashcard content.
    - Rephrasing Requirement: Avoid copying the exact wording from the flashcard. Instead, rephrase to encourage critical thinking.
    - Answer Choices: Each question must have four answer choices, with only one correct answer.
    - Plausible Distractors: The incorrect choices (distractors) should be plausible but incorrect.c
    - Question Types: Ensure a mix of:
        - Direct recall questions
        - Application-based questions
        - Conceptual questions
    - Error Handling: If the flashcard set is too small to generate the required number of questions, 
        return the following error message instead of an incomplete quiz:
        { "quiz": [], "errorMessage": "Insufficient flashcards to generate ${number} questions." }

    ### Instructions for Generating the Quiz:
    1. Analyze the provided description-term pairs
    2. Generate exactly ${number} well-structured questions.
    3. Strictly follow the expected output format below.

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
    }`;
    return prompt;
}

