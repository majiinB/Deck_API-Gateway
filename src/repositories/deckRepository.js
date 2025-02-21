import { db } from '../config/firebaseAdminConfig.js'
import { formatDeck } from '../models/deckModel.js';

export const getDeckById = async (deckId) => {
    try {
        const deckRef = db.collection("decks").doc(deckId);
        const deckSnap = await deckRef.get();

        if (!deckSnap.exists) throw new Error("Deck not found");

        const questionSnap = await deckRef.collection("questions").where("is_deleted", "==", false).get();
        const questions = questionSnap?.docs?.map(doc => ({ id: doc.id, ...doc.data() })) || [];
        const deckData = deckSnap.data();

        return formatDeck(deckSnap.id, deckData, questions);

    } catch (error) {
        console.error('Error fetching deck: ', error);
        throw error;
    }

}