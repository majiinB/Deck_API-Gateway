import openai from '../config/openaiConfig.js';
import { Storage } from '@google-cloud/storage';
import { PDFExtract } from 'pdf.js-extract';
import fs from 'fs';
import * as dotenv from 'dotenv';
import { log } from 'console';
import os from 'os';
import { fileManager } from '../config/geminiConfig.js';
import mime from 'mime';
dotenv.config();


/**
 * Get MIME type from file extension.
 * @param {string} extension - The file extension (e.g., 'jpg', 'png', 'pdf').
 * @returns {string} - The corresponding MIME type or 'application/octet-stream' if not found.
 */
export function getMimeType(extension) {
    // Ensure the extension starts with a dot (e.g., '.jpg')
    const ext = extension.startsWith('.') ? extension : `.${extension}`;

    // Get the MIME type using the mime library
    const mimeType = mime.getType(ext);

    // Return the MIME type or a default fallback
    return mimeType || 'application/octet-stream';
}

export async function uploadToGemini(path, mimeType) {
    const uploadResult = await fileManager.uploadFile(path, {
        mimeType,
        displayName: path,
    });
    const file = uploadResult.file;
    console.log(`Uploaded file ${file.displayName} as: ${file.name}`);
    return file;
}

export async function waitForFilesActive(files) {
    console.log("Waiting for file processing...");
    for (const name of files.map((file) => file.name)) {
        let file = await fileManager.getFile(name);
        while (file.state === "PROCESSING") {
            process.stdout.write(".")
            await new Promise((resolve) => setTimeout(resolve, 10_000));
            file = await fileManager.getFile(name)
        }
        if (file.state !== "ACTIVE") {
            throw Error(`File ${file.name} failed to process`);
        }
    }
    console.log("...all files ready\n");
}

export function constructGoogleAIPrompt(topic, subject, addDescription, numberOfQuestions) {
    // Initialize prompt
    let prompt = 'I want you to act as a Professor providing students with questions and answers but strictly,' +
        ' answer in JSON format and no introductory sentences, write it like a code generator.' +
        'the format is {questions:{question: 1+1, answer: 2}, {question:2+3, answer:5}}';
    let instruction = `Instructions: give me ${numberOfQuestions} questions with answers.`;
    let lastLinePrompt = `Do not repeat questions. Also make the questions 1-2 sentences max and the answers 1 sentence max or the keypoint only`;

    // Condition to determine prompt
    if (subject) prompt += `the subject is ${subject}. `;
    if (topic) prompt += `and the topic is ${topic}. `;
    if (addDescription) prompt += `Additional description: ${addDescription}. `;
    prompt += instruction;
    prompt += lastLinePrompt;

    return prompt;
}

// Function to extract and parse the JSON from the text
export function extractGoogleAIJsonFromText(response) {
    // Check if the response and response.text exist and are strings
    if (!response || typeof response !== 'string') {
        console.error('Invalid input: response.text is missing or not a string');
        return {}; // Return null if input is invalid
    }

    // Remove the backticks and the 'json' keyword
    const cleanedText = response
        .replace(/^```json\s*/, '') // Remove leading ```json
        .replace(/```$/, ''); // Remove trailing ```

    try {
        // Parse the cleaned text into a JSON object
        return JSON.parse(cleanedText);
    } catch (error) {
        console.error('Failed to parse JSON:', error);
        return {}; // Return null if parsing fails
    }
}

export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function isValidInteger(value) {
    // Check if value is an integer and satisfies range of conditions
    return Number.isInteger(value) && value > 1 && value <= 20;
}

export async function createThread(isNewMessage, givenThread) {
    let thread;
    let threadObj;

    if (isNewMessage) {
        threadObj = await openai.beta.threads.create();
        thread = threadObj.id;
    } else if (!isNewMessage && givenThread !== "no_thread_id") {
        thread = givenThread;
    }
    return thread;
}

export async function downloadFile(fileName, fileExtension, id) {
    let filePath = '';
    try {
        // Create a reference to google cloud storage
        console.log(process.env.KEY_FILE.toString());
        const storage = new Storage({
            keyFilename: process.env.KEY_FILE.toString(),
        });
        //console.log(storage.toJSON());
        // Create referece to storage bucket
        let bucketName = process.env.STORAGE_BUCKET.toString();

        let destFilename = `download-${id}${fileExtension}`; // Use original extension dynamically

        const options = {
            // The path to which the file should be downloaded, e.g. "./file.txt"
            destination: `./downloads/${destFilename}`,
        };

        // Downloads the file from google cloud
        await storage.bucket(bucketName).file(`uploads/${id}/${fileName}`).download(options);

        filePath = `./downloads/${destFilename}`;
    } catch (error) {
        console.log(`DOWNLOAD PDF ERROR:${error}`);
        return filePath = '';
    }
    return filePath;
}

export async function downloadPdf(fileName, id) {
    let filePath = '';
    try {
        // Create a reference to google cloud storage
        console.log(process.env.KEY_FILE.toString());
        const storage = new Storage({
            keyFilename: process.env.KEY_FILE.toString(),
        });
        //console.log(storage.toJSON());
        // Create referece to storage bucket
        let bucketName = process.env.STORAGE_BUCKET.toString();

        let destFilename = `download-${id}.pdf`; // Name of file when downloaded

        const options = {
            // The path to which the file should be downloaded, e.g. "./file.txt"
            destination: `./downloads/${destFilename}`,
        };

        // Downloads the file from google cloud
        await storage.bucket(bucketName).file(`uploads/${id}/${fileName}`).download(options);

        filePath = `./downloads/${destFilename}`;
    } catch (error) {
        console.log(`DOWNLOAD PDF ERROR:${error}`);
        return filePath = '';
    }
    return filePath;
}

export function extractPdfText(pdfFilePath) {
    return new Promise((resolve, reject) => {
        try {
            const pdfExtract = new PDFExtract();

            const options = {
                normalizeWhitespace: true,
            };

            pdfExtract.extract(pdfFilePath, options, (err, data) => {
                if (err) {
                    console.error('Error extracting PDF:', err);
                    reject(err); // Reject the promise if an error occurs
                } else {
                    // Log the content of each page
                    const { pages } = data;
                    console.log(data.pageInfo);
                    console.log(data.links);
                    console.log(data.content);
                    let concatenatedText = '';

                    // Loop through each page
                    pages.forEach((page, pageIndex) => {
                        console.log(`Content of Page ${pageIndex + 1}:`);

                        // Loop through the content array of each page
                        page.content.forEach((textElement, textIndex) => {
                            console.log(`String content ${textElement.str}:`);
                            concatenatedText += textElement.str;
                        });
                    });
                    // Resolve the promise with the extracted text
                    let cleanText = cleanString(concatenatedText);
                    resolve(cleanText);
                }
            });
        } catch (error) {
            // Handle any errors that occur during PDF parsing
            console.error('Error parsing PDF:', error);
            reject(error); // Reject the promise if an error occurs
        }
    });
}

export function deleteFile(filePath) {
    try {
        fs.unlinkSync(filePath); // delete pdf
        console.log('File deleted successfully');
        return true;
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log('File does not exist');
            return false;
        } else {
            console.error('Error deleting file:', err);
            return false;
        }
    }
}

export function cleanString(inputString) {
    // Remove special characters using regular expression
    let cleanedString = inputString.replace(/[^\w\s]/gi, '');

    // Remove multiple spaces
    cleanedString = cleanedString.replace(/\s{2,}/g, ' ');

    // Remove bullet characters
    cleanedString = cleanedString.replace(/•/g, '');

    return cleanedString;
}
export function getIPAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip over non-IPv4 and internal (i.e., 127.0.0.1) addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address; // Return the IPv4 address as a string
            }
        }
    }
    return null; // Return null if no external IPv4 address is found
}

