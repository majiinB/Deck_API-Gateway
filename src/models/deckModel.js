// utils/formatDeck.js

export const formatDeck = (deckId, deckData, flashcards) => ({
    id: deckId,
    title: deckData.title,
    isDeleted: deckData.is_deleted,
    isPrivate: deckData.is_private,
    deckOwnerId: deckData.user_id,
    // description: deckData.description, TO-DO: add a description field for deck
    createdAt: deckData.created_at,
    flashcards: flashcards.map(f => ({
        id: f.id,
        description: f.description,
        term: f.term
    }))
});

