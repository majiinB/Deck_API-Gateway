/**
 * Gemini Utility Functions
 * 
 * @file gemini.utils.js
 * @description This module provides utility functions for interacting with the Gemini model, handling file uploads,
 * downloads, prompt construction, and response parsing. It supports PDF input processing and manages asynchronous 
 * file states from Gemini services.
 * 
 * Dependencies:
 * - model: Gemini model configuration from geminiConfig.js
 * - fileManager: File handling service from geminiConfig.js
 * - Google Cloud Storage: Handles file storage and download operations
 * - mime: Library for determining MIME types based on file extensions
 * - dotenv: Loads environment variables from a .env file
 * 
 * @module gemini.utils
 * @author Arthur M. Artugue
 * @created 2024-06-10
 * @updated 2024-10-26
 */

import { model, fileManager } from '../config/geminiConfig.js';
import { Storage } from '@google-cloud/storage';
import mime from 'mime';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Sends a prompt to the Gemini model, optionally including a PDF file.
 * 
 * @async
 * @param {boolean} isTherePdf - Indicates whether a PDF file is included.
 * @param {string} prompt - The prompt text to be sent to the Gemini model.
 * @param {string} [filePath=""] - The path to the PDF file (if any).
 * @param {string} [fileExtension=""] - The file extension of the PDF.
 * @returns {Promise<string>} - The response content generated by the model.
 */
export async function sendPrompt(isTherePdf, prompt, filePath = "", fileExtension = "") {
    let result;

    if (isTherePdf) {
        const fileType = getMimeType(fileExtension);
        const files = [await uploadToGemini(filePath, fileType)];
        await waitForFilesActive(files);

        result = await model.generateContent([
            {
                fileData: {
                    mimeType: files[0].mimeType,
                    fileUri: files[0].uri
                }
            },
            { text: prompt }
        ]);
    } else {
        result = await model.generateContent(prompt);
    }

    const response = result.response.candidates[0].content.parts[0].text;
    return extractGoogleAIJsonFromText(response);
}

/**
 * Gets the MIME type for a given file extension.
 * 
 * @param {string} extension - The file extension (e.g., 'pdf', 'jpg').
 * @returns {string} - The corresponding MIME type or 'application/octet-stream' if not found.
 */
export function getMimeType(extension) {
    const ext = extension.startsWith('.') ? extension : `.${extension}`;
    return mime.getType(ext) || 'application/octet-stream';
}

/**
 * Uploads a file to Gemini and returns the file object.
 * 
 * @async
 * @param {string} path - The path to the file to upload.
 * @param {string} mimeType - The MIME type of the file.
 * @returns {Promise<Object>} - The uploaded file object.
 */
export async function uploadToGemini(path, mimeType) {
    const uploadResult = await fileManager.uploadFile(path, {
        mimeType,
        displayName: path,
    });
    const file = uploadResult.file;
    console.log(`Uploaded file ${file.displayName} as: ${file.name}`);
    return file;
}

/**
 * Waits until all uploaded files are in the 'ACTIVE' state.
 * 
 * @async
 * @param {Array<Object>} files - List of uploaded file objects.
 * @throws {Error} - If a file fails to become active.
 */
export async function waitForFilesActive(files) {
    console.log("Waiting for file processing...");
    for (const name of files.map((file) => file.name)) {
        let file = await fileManager.getFile(name);
        while (file.state === "PROCESSING") {
            process.stdout.write(".");
            await new Promise((resolve) => setTimeout(resolve, 10_000));
            file = await fileManager.getFile(name);
        }
        if (file.state !== "ACTIVE") {
            throw new Error(`File ${file.name} failed to process`);
        }
    }
    console.log("...all files ready\n");
}

/**
 * Constructs a JSON prompt for the Google AI model.
 * 
 * @param {string} topic - The topic for the questions.
 * @param {string} subject - The subject area for the questions.
 * @param {string} addDescription - Additional description for the prompt.
 * @param {number} numberOfQuestions - Number of questions to generate.
 * @returns {string} - The constructed JSON prompt.
 */
export function constructGoogleAIPrompt(topic, subject, addDescription, numberOfQuestions) {
    let prompt = 'I want you to act as a Professor providing students with questions and answers, strictly ' +
        'in JSON format without introductory sentences. Format: {questions:{question: "1+1", answer: "2"}, {question: "2+1", answer: "3"}}. ';
    let instruction = `Instructions: give me ${numberOfQuestions} questions with answers. `;
    let lastLinePrompt = 'Do not repeat questions. Keep them concise, with 1-2 sentence questions and brief answers.';

    if (subject) prompt += `The subject is ${subject}. `;
    if (topic) prompt += `The topic is ${topic}. `;
    if (addDescription) prompt += `Additional description: ${addDescription}. `;
    prompt += instruction + lastLinePrompt;

    return prompt;
}

/**
 * Extracts and parses JSON content from the response text.
 * 
 * @param {string} response - The response text from the model.
 * @returns {Object} - The parsed JSON object or an empty object if parsing fails.
 */
export function extractGoogleAIJsonFromText(response) {
    if (!response || typeof response !== 'string') {
        console.error('Invalid input: response.text is missing or not a string');
        return {};
    }

    const cleanedText = response
        .replace(/^```json\s*/, '')
        .replace(/```$/, '');

    try {
        return JSON.parse(cleanedText);
    } catch (error) {
        console.error('Failed to parse JSON:', error);
        return {};
    }
}

/**
 * Downloads a file from Google Cloud Storage.
 * 
 * @async
 * @param {string} fileName - The name of the file to download.
 * @param {string} fileExtension - The file extension to append to the downloaded file.
 * @param {string} id - The unique identifier for the file.
 * @returns {Promise<string>} - The local path to the downloaded file.
 */
export async function downloadFile(fileName, fileExtension, id) {
    let filePath = '';
    try {
        const storage = new Storage({
            keyFilename: process.env.KEY_FILE.toString(),
        });

        const bucketName = process.env.STORAGE_BUCKET.toString();
        const destFilename = `download-${id}${fileExtension}`;
        const options = { destination: `./downloads/${destFilename}` };

        await storage.bucket(bucketName).file(`uploads/${id}/${fileName}`).download(options);
        filePath = `./downloads/${destFilename}`;
    } catch (error) {
        console.log(`DOWNLOAD PDF ERROR: ${error}`);
        filePath = '';
    }
    return filePath;
}
