/**
 * Quiz Repository
 * 
 * @file quizRepository.js
 * @description Handles database operations related to deck retrieval.
 * 
 * This module provides functions to fetch deck data from Firestore,
 * ensuring proper validation and error handling.
 * 
 * @module quizRepository
 * 
 * @requires ../config/firebaseAdminConfig.js
 * @requires ../models/deckModel.js
 * 
 * @author Arthur M. Artugue
 * @created 2025-03-05
 * @updated 2025-03-05
 */

import { db, timeStamp } from '../config/firebaseAdminConfig.js';
import { formatDeck } from '../models/deckModel.js';

export async function createQuizForDeck(quizData) {
    try {
        const res = await db.collection('quiz').add(quizData);
        return res.id;
    } catch (error) {
        console.log(`Create quiz for deck function error: ${error}`);
        throw new Error('Create quiz for deck function error');
    }
}

export async function createQuestionAndAnswer(quizId, questionAndAnswer) {
    try {
        const ref = db.collection('quiz').doc(quizId).collection('question_and_answers');
    
        for(const[index, item] of questionAndAnswer.entries()) {
            const questionAndAnswerRef = await ref.add({
                question: item.question,
                created_at: timeStamp,
                related_flashcard_id: item.related_flashcard_id,
            });

            await createChoices(questionAndAnswerRef.id, item.choices, ref);
        }
    } catch (error) {
        console.log(`Create question and answer function error: ${error}`);
        if (error.message == 'Create choices error') {
            throw new Error('Create choices error');
        }else throw new Error('Create question and answer function error');
    }
}

export async function createChoices(questionAndAnswerId, choices, ref) {
    try {
        for(const choice of choices) {
            await ref.doc(questionAndAnswerId).collection('choices').add({
                text: choice.text,
                is_correct: choice.is_correct,
            })
        }
    } catch (error) {
        console.log(`Create choices function error: ${error}`);
        throw new Error("Create choices error");
    }
}

export async function getQuizByDeckIDAndQuizType(deckId, quizType){
    try {
        const quizSnap = await db.collection('quiz')
        .where("associated_deck_id", "==", deckId)
        .where("quiz_type", "==", quizType)
        .get();

        const quiz = quizSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) || [];
        return quiz;

    } catch (error) {
        console.log(`Get quiz by deck and quiz type function error: ${error}`);
        throw new Error("Quiz retrieval by deck id and quiz type error");
    }
}
