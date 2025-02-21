// utils/formatDeck.js

export const formatDeck = (deckId, deckData, questions) => ({
    id: deckId,
    title: deckData.title,
    isDeleted: deckData.is_deleted,
    isPrivate: deckData.is_private,
    deckOwnerId: deckData.user_id,
    // description: deckData.description, TO-DO: add a description field for deck
    createdAt: deckData.created_at,
    questions: questions.map(q => ({
        id: q.id,
        question: q.question,
        answer: q.answer
    }))
});

