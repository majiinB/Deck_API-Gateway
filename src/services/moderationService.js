/**
 * Deck API - Moderation Service
 *
 * @file moderationService.js
 * @description Provides services for processing AI-generated flashcard prompts.
 * 
 * This module interacts with AI models (Gemini and OpenAI) to generate flashcards based on user input.
 * It handles file retrieval, prompt construction, and API communication.
 * 
 * @module moderationService
 * 
 * @requires ../utils/utils.js
 * @requires ../services/aiService.js
 * @requires ../repositories/fileRepository.js
 * 
 * @author Arthur M. Artugue
 * @created 2025-02-20
 * @updated 2025-02-20
 * 
 */
import { getDeckById } from "../repositories/deckRepository.js";
import { sendPromptModeration } from "./aiService.js";
import { moderatedFlashcardsSchema } from "../schema/flashcardModerationSchema.js";

export const geminiModerationService = async (deckId, id) => {

    const aiResponses = [];
    const deck = await getDeckById(deckId);
    const deckTermsAndDef = deck.questions;
    const chunkedQuestions = chunkArray(deckTermsAndDef, 10);

    for (const questionGroup of chunkedQuestions) {
        let prompt = moderationPrompt(formatPrompt(questionGroup));
        let response = await sendPromptModeration(prompt);
        aiResponses.push(response);
    }
    // console.log(JSON.stringify(aiResponses, null, 2));
    // console.log(aiResponses);

    return aggregateModerationResults(aiResponses);
}

const chunkArray = (array, chunkSize) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
};

const formatPrompt = (questionsChunk) => {
    return questionsChunk.map(q => `Description: ${q.question}\nTerm: ${q.answer}`).join("\n\n");
};

const aggregateModerationResults = (aiResponses) => {
    let isAppropriate = true;
    let inappropriateItems = [];
    let moderationDecision = 'Content is appropriate';

    for (const response of aiResponses) {
        if (!response.data.overall_verdict.is_appropriate) {
            isAppropriate = false;
            moderationDecision = response.data.overall_verdict.moderation_decision;
            // Ensure flagged_cards exists and is an array before concatenation
            if (Array.isArray(response.data.overall_verdict.flagged_cards) && response.data.overall_verdict.flagged_cards.length > 0) {
                inappropriateItems = inappropriateItems.concat(response.data.overall_verdict.flagged_cards);
            }
        }
    }

    return {
        is_appropriate: isAppropriate,
        moderation_decision: moderationDecision,
        flagged_cards: inappropriateItems // Ensures it always returns an array
    };
};


const moderationPrompt = (questionsChunk) => {
    const prompt = `You are an AI content moderator. Your task is to review the following description and terms to 
                    determine if any content is inappropriate.

                    ### Inappropriate content includes:
                    - Hate speech, discrimination, or offensive language.
                    - Sexual, violent, or disturbing content.
                    - Misinformation or misleading facts.
                    - Any content that is harmful, unethical, or violates academic integrity.

                    ### Instructions:
                    1. Review each description-term pair.
                    2. Identify any inappropriate content based on the given criteria.
                    3. Return your moderation decision accordingly and STRICTLY FOLLOW THE FORMAT.

                    ## Expected sample output format ##
                    Example 1:
                    overall_verdict{
                        is_appropriate: true,
                        moderation_decision: "content is appropriate",
                        flagged_cards: [] //empty because the overall decision is appropriate
                    }

                    Example 2:
                    overall_verdict{
                        is_appropriate: false,
                        moderation_decision: "content is inappropriate",
                        flagged_cards: [
                            {
                                description: "Inappropriate description from flashcard",
                                term: "Inappropriate term of flashcard,
                                reason: "Reason for why is it inappropriate and became flagged"
                            }
                        ] 
                    }

                    ### Content to Moderate:
                    ${questionsChunk}
        `;
    return prompt;
}
