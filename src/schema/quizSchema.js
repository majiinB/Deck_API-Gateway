import { SchemaType } from "@google/generative-ai";

export const promptFlashCardChoicesSchema = {
    description: "A multiple-choice question with related flashcard ID and answer choices",
    type: SchemaType.OBJECT,
    properties: {
        question: {
            type: SchemaType.STRING,
            description: "The multiple-choice question",
        },
        related_flashcard_id: {
            type: SchemaType.STRING,
            description: "The ID of the related flashcard where the question and answer is based from. Can be only one ID",
        },
        choices: {
            type: SchemaType.ARRAY,
            description: "List of answer choices with correctness indication",
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    text: {
                        type: SchemaType.STRING,
                        description: "The text of the answer choice",
                    },
                    is_correct: {
                        type: SchemaType.BOOLEAN,
                        description: "Indicates whether the choice is correct",
                    },
                },
                required: ["text", "is_correct"],
            },
        },
    },
    required: ["question", "related_flashcard_id", "choices"],
};
