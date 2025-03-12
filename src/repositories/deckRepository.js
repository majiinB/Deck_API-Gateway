/**
 * Deck Repository
 * 
 * @file deckRepository.js
 * @description Handles database operations related to deck retrieval.
 * 
 * This module provides functions to fetch deck data from Firestore,
 * ensuring proper validation and error handling.
 * 
 * @module deckRepository
 * 
 * @requires ../config/firebaseAdminConfig.js
 * @requires ../models/deckModel.js
 * 
 * @author Arthur M. Artugue
 * @created 2025-02-21
 * @updated 2025-03-12
 */

import { db, timeStamp } from '../config/firebaseAdminConfig.js';
import { formatDeck } from '../models/deckModel.js';

/**
 * Fetches a deck by its ID from Firestore.
 * 
 * @async
 * @function getDeckById
 * @param {string} deckId - The unique identifier of the deck.
 * @returns {Promise<Object>} - Returns a formatted deck object.
 * @throws {Error} - Throws an error if the deck ID is invalid, not found, or has no valid questions.
 */
export const getDeckById = async (deckId) => {
    try {
        // Validate inputs
        if (!deckId || typeof deckId !== 'string') {
            throw new Error("INVALID_DECK_ID");
        }

        const deckRef = db.collection("decks").doc(deckId);
        const deckSnap = await deckRef.get();
    
        // If deck does not exist
        if (!deckSnap.exists) throw new Error("DECK_NOT_FOUND");
    
        const questionSnap = await deckRef.collection("questions").where("is_deleted", "==", false).get();
        const questions = questionSnap?.docs?.map(doc => ({ id: doc.id, ...doc.data() })) || [];
    
        if (questions.length === 0) throw new Error("NO_VALID_QUESTIONS");
    
        const deckData = deckSnap.data();

        return formatDeck(deckSnap.id, deckData, questions);
    } catch (error) {
        console.error(`Error in getDeckById (deckId: ${deckId}):`, error);
        throw new Error(error.message);
    }
};

/**
 * Fetches a deck by its ID from Firestore.
 * 
 * @async
 * @function getDeckById
 * @param {string} deckId - The unique identifier of the deck.
 * @returns {Promise<Object>} - Returns a formatted deck object.
 * @throws {Error} - Throws an error if the deck ID is invalid, not found, or has no valid questions.
 */
export const getDeckAndCheckField = async (deckId, fieldName) => {
    try {
        // Validate inputs
        if (!deckId || typeof deckId !== 'string') {
            throw new Error("INVALID_DECK_ID");
        }
        if (!fieldName || typeof fieldName !== 'string') {
            throw new Error("INVALID_FIELD_NAME");
        }

        // Fetch deck document
        const deckRef = db.collection('decks').doc(deckId);
        const deckSnap = await deckRef.get();

        if (!deckSnap.exists) throw new Error("DECK_NOT_FOUND");

        const deckData = deckSnap.data();
        
        if (!deckData.hasOwnProperty(fieldName))  {
            return {
                exists: true,
                field_exists: false,
                data: null
            }
        };

        return { 
            exists: true, 
            field_exists: true, 
            data: deckData[fieldName] 
        };

    } catch (error) {
        console.error(`Error in getDeckAndCheckField (deckId: ${deckId}, fieldName: ${fieldName}):`, error);
        throw new Error(error.message);
    }
};

/**
 * Updates a deck document in Firestore with the provided data.
 * 
 * @async
 * @function updateDeck
 * @param {string} deckId - The unique identifier of the deck to update.
 * @param {Object} data - The key-value pairs representing the fields to update.
 * @returns {Promise<void>} - Resolves if the update is successful.
 * @throws {Error} - Throws an error if the deck ID is invalid, the update data is not an object, or the update operation fails.
 */
export const updateDeck = async (deckId, data) => {
    try {
        // Validate inputs
        if (!deckId || typeof deckId !== 'string') {
            throw new Error("INVALID_DECK_ID");
        }
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error("INVALID_UPDATE_DATA");
        }

        const deckRef = db.collection('decks').doc(deckId);
        await deckRef.update(data);
    } catch (error) {
        console.error(`Error in updateDeck (deckId: ${deckId}, data: ${data})`, error);
        throw new Error(error.message);
    }
}

/**
 * Fetches newly created flashcards for a given deck based on its last update time.
 * 
 * @async
 * @function getNewFlashcards
 * @param {string} deckId - The unique identifier of the deck.
 * @returns {Promise<Array<Object>>} - Returns an array of new flashcards.
 * @throws {Error} - Throws an error if the deck ID is invalid, the deck is not found, or the query operation fails.
 */
export const getNewFlashcards = async (deckId) => {
    try {
        // Validate input
        if (!deckId || typeof deckId !== "string") {
            throw new Error("INVALID_DECK_ID");
        }

        // Reference to the deck document
        const deckRef = db.collection("decks").doc(deckId);
        const deckSnap = await deckRef.get();

        // Check if deck exists
        if (!deckSnap.exists) {
            throw new Error("DECK_NOT_FOUND");
        }

        // Retrieve last updated timestamp
        const deckData = deckSnap.data();
        const madeToQuizAt = deckData?.made_to_quiz_at;

        if (!madeToQuizAt) {
            throw new Error("MISSING_MADE_TO_QUIZ_AT_FIELD");
        }

        // Query new flashcards created after the last update
        const questionSnap = await deckRef
            .collection("questions")
            .where("is_deleted", "==", false)
            .where("created_at", ">=", madeToQuizAt) 
            .get();

        // Extract flashcard data
        const questions = questionSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) || [];

        return questions;
    } catch (error) {
        console.error(`Error in getNewFlashcards (deckId: ${deckId}):`, error);
        throw new Error(error.message);
    }
};

export const createDeck = async (deckData) => {
    try {
        // Validate input
        if (!deckData || typeof deckData !== 'object') {
            throw new Error("INVALID_QUIZ_DATA");
        }

        const res = await db.collection('decks').add(deckData);
        return res.id;
    } catch (error) {
        console.error(`Create deck function error: ${error}`);
        throw new Error(error.message);
    }
}

