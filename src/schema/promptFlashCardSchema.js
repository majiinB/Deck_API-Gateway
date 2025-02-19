export const promptFlashCardSchema = {
    description: "List of definition with terms",
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
                        nullable: false,
                    },
                    term: {
                        type: "string",
                        description: "The term that the definition pertains to",
                        nullable: false,
                    },
                },
                required: ["definition", "term"],
            },
        },
    },
    required: ["definition_and_terms"],
};
