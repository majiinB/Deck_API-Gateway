import openai from "../config/openaiConfig.js";
import firebaseApp from "../config/firebaseConfig.js";
import { createThread, extractPdfText, deleteFile, isValidInteger } from '../utils/utils.js';
import { sendPrompt, constructGoogleAIPrompt } from '../services/aiService.js';
import { downloadFile, downloadPdf } from "../repositories/fileRepository.js";

export const promptGeminiService = async (request) => {
    const { subject, topic, addDescription, fileName, fileExtension, numberOfQuestions } = request.body;

    const prompt = constructGoogleAIPrompt(topic, subject, addDescription, numberOfQuestions);

    if (fileName) {
        if (!fileExtension) {
            return { status: 422, message: 'File extension is required.' };
        }

        try {
            const filePath = await downloadFile(fileName, fileExtension, id);

            if (!filePath) {
                return { status: 500, message: 'Error retrieving the file from the server.' };
            }

            const response = await sendPrompt(true, prompt, filePath, fileExtension);
            deleteFile(filePath);

            return { status: 200, data: response };
        } catch (error) {
            console.error('Error during file retrieval:', error);
            return { status: 500, message: 'Error retrieving the file from the server.' };
        }
    } else {
        const response = await sendPrompt(false, prompt);
        return { status: 200, data: response };
    }
}

export const promptOpenAI = async (request) => {
    const { subject, topic, addDescription, pdfFileName, numberOfQuestions, isNewMessage, threadID } = request.body;
    let prompt = `Instructions: give me ${numberOfQuestions} questions with answers.`;
    let pdfInfo = 'Source of information to use:';
    let lastLinePrompt = 'Do not repeat questions. Keep questions 1-2 sentences and answers 1 sentence or keypoint only.';

    // Extract text from PDF if provided
    if (pdfFileName) {
        try {
            const filePath = await downloadPdf(pdfFileName, id);
            const extractedText = await extractPdfText(filePath);

            if (!extractedText) {
                return { status: 421, message: 'PDF extraction failed. Please use a valid PDF file.' };
            }

            if (!deleteFile(filePath)) {
                return { status: 422, message: 'PDF deletion failed on the server.' };
            }

            pdfInfo += extractedText;
        } catch (error) {
            console.error('Error extracting PDF text:', error);
            return { status: 501, message: 'Error during PDF text extraction.' };
        }
    }

    // Build the prompt based on input
    if (pdfFileName) {
        if (subject) prompt += ` The subject is ${subject}.`;
        if (topic) prompt += ` The topic is ${topic}.`;
        if (addDescription) prompt += ` Additional description: ${addDescription}.`;
        prompt += pdfInfo;
    } else {
        if (!subject || !topic) {
            return { status: 423, message: 'Subject and topic are required if no PDF is uploaded.' };
        }
        if (subject) prompt += ` The subject is ${subject}.`;
        if (topic) prompt += ` The topic is ${topic}.`;
        if (addDescription) prompt += ` Additional description: ${addDescription}.`;
    }

    prompt += lastLinePrompt;

    try {
        const thread = await createThread(isNewMessage, threadID);
        await openai.beta.threads.messages.create(thread, { role: 'user', content: prompt });

        const run = await openai.beta.threads.runs.create(thread, {
            assistant_id: assistant.id,
            instructions: 'Act as a professor providing JSON-formatted Q&A. Return empty JSON if message is non-academic, vulgar, vague, or personal.'
        });

        return {
            status: 200,
            data: {
                thread_id: run.thread_id,
                run_id: run.id
            }
        };
    } catch (error) {
        console.error('Error processing the OpenAI request:', error);
        return { status: 424, message: 'Error processing the message route.' };
    }
};
