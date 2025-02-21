export const promptFlashCardSchema = {
    description: "List of definitions with terms or an error message if generation fails",
    type: "object",
    properties: {
        definition_and_terms: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    definition: {
                        type: "string",
                        description: "The definition of the term",
                        nullable: true, // Now nullable in case AI cannot generate a response
                    },
                    term: {
                        type: "string",
                        description: "The term that the definition pertains to",
                        nullable: true, // Now nullable in case AI cannot generate a response
                    },
                },
                required: [], // No required fields, as they can be null
            },
        },
        errorMessage: {
            type: "string",
            description: "Error message if AI cannot generate a response due to inappropriate content or context",
            nullable: true,
        },
    },
    required: ["definition_and_terms"], // Keeping the array required, but it can be empty if errorMessage is present
};
