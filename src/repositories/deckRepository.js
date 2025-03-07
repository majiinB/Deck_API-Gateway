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
 * @updated 2025-02-22
 */

import { db } from '../config/firebaseAdminConfig.js';
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

    const deckRef = db.collection("decks").doc(deckId);
    const deckSnap = await deckRef.get();

    if (!deckSnap.exists) throw new Error("Deck not found");

    const questionSnap = await deckRef.collection("questions").where("is_deleted", "==", false).get();
    const questions = questionSnap?.docs?.map(doc => ({ id: doc.id, ...doc.data() })) || [];

    if (questions.length === 0) throw new Error("Deck has no valid questions");

    const deckData = deckSnap.data();

    return formatDeck(deckSnap.id, deckData, questions);
};

export const getDeckAndCheckField = async (deckId, fieldName) => {
    try {
        const deckRef = db.collection('decks').doc(deckId);
        const deckSnap = await deckRef.get();

        if (!deckSnap.exists) return{ exists: false, field_exists: false, message: 'Deck not found', data: null };
        
        const deckData = deckSnap.data();
        const fieldExists = deckData.hasOwnProperty(fieldName);

        if (!fieldExists) return{ exists: true, field_exists: false, message: `Deck has no ${fieldName} field`, data: null }

        return { exists: true, field_exists: true, message: null, data: deckData['updated_at'] };
        
    } catch (error) {
        console.error('Error fetching deck and checking field:', error);
        return { exists: false, field_exists: false, message: 'An error occurred while fetching deck and checking field', data: null };
    }
}

export const updateDeck = async (deckId, data) => {
    try {
        const deckRef = db.collection('decks').doc(deckId);
        await deckRef.update(data);
    } catch (error) {
        console.error('Error updating deck:', error);
        throw new Error(error);
    }
}

export const getNewFlashcards = async (deckId) => {
    try {
        const deckRef = db.collection("decks").doc(deckId);
        const deckSnap = await deckRef.get();

        if (!deckSnap.exists) throw new Error("Deck not found");

        const updated_at = deckSnap.data().updated_at;

        const questionSnap = await deckRef
            .collection("questions")
            .where("is_deleted", "==", false)
            .where("created_at", ">=", updated_at) // Ensure correct field name
            .get();

        const questions = questionSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) || [];

        return questions;
    } catch (error) {
        console.error("Error fetching new flashcards:", error);
        throw new Error("Failed to retrieve flashcards");
    }
};
