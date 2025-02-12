/**
 * utils.js
 * 
 * This utility module provides helper functions for tasks such as:
 * - Delaying code execution.
 * - Validating integer input.
 * - Creating and managing threads with the OpenAI API.
 * - Downloading PDF files from Google Cloud Storage.
 * - Extracting text from PDF files.
 * - Deleting files from the local filesystem.
 * - Cleaning string content by removing special characters, multiple spaces, and bullets.
 * 
 * These functions help streamline common operations needed across the application, 
 * improving modularity and code reusability.
 */

import openai from '../config/openaiConfig.js';
import { Storage } from '@google-cloud/storage';
import { PDFExtract } from 'pdf.js-extract';
import fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Delays the execution by the specified milliseconds.
 * @param {number} ms - Time to delay in milliseconds.
 * @returns {Promise<void>} - A promise that resolves after the delay.
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Checks if a value is a valid integer within a specific range.
 * @param {*} value - The value to validate.
 * @returns {boolean} - True if the value is an integer between 2 and 20, otherwise false.
 */
export function isValidInteger(value) {
    return Number.isInteger(value) && value > 1 && value <= 20;
}

/**
 * Creates or retrieves a thread based on the input parameters.
 * @param {boolean} isNewMessage - Indicates if a new thread is to be created.
 * @param {string} givenThread - An existing thread ID or 'no_thread_id' if not applicable.
 * @returns {Promise<string>} - The ID of the created or provided thread.
 */
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

/**
 * Downloads a PDF from Google Cloud Storage.
 * @param {string} fileName - The name of the PDF file to download.
 * @param {string} id - A unique identifier used to locate the file.
 * @returns {Promise<string>} - The file path where the PDF was downloaded, or an empty string if an error occurs.
 */
export async function downloadPdf(fileName, id) {
    let filePath = '';
    try {
        console.log(process.env.KEY_FILE.toString());
        const storage = new Storage({
            keyFilename: process.env.KEY_FILE.toString(),
        });

        let bucketName = process.env.STORAGE_BUCKET.toString();
        let destFilename = `download-${id}.pdf`; // Name of the file when downloaded
        const options = {
            destination: `./downloads/${destFilename}`,
        };

        await storage.bucket(bucketName).file(`uploads/${id}/${fileName}`).download(options);
        filePath = `./downloads/${destFilename}`;
    } catch (error) {
        console.log(`DOWNLOAD PDF ERROR: ${error}`);
        return '';
    }
    return filePath;
}

/**
 * Extracts and concatenates text from a PDF file.
 * @param {string} pdfFilePath - The path to the PDF file.
 * @returns {Promise<string>} - A promise that resolves with the extracted text.
 */
export function extractPdfText(pdfFilePath) {
    return new Promise((resolve, reject) => {
        try {
            const pdfExtract = new PDFExtract();
            const options = { normalizeWhitespace: true };

            pdfExtract.extract(pdfFilePath, options, (err, data) => {
                if (err) {
                    console.error('Error extracting PDF:', err);
                    reject(err);
                } else {
                    const { pages } = data;
                    let concatenatedText = '';

                    pages.forEach((page, pageIndex) => {
                        console.log(`Content of Page ${pageIndex + 1}:`);
                        page.content.forEach(textElement => {
                            console.log(`String content: ${textElement.str}`);
                            concatenatedText += textElement.str;
                        });
                    });

                    resolve(cleanString(concatenatedText));
                }
            });
        } catch (error) {
            console.error('Error parsing PDF:', error);
            reject(error);
        }
    });
}

/**
 * Deletes a file from the file system.
 * @param {string} filePath - The path to the file to delete.
 * @returns {boolean} - True if the file was successfully deleted, otherwise false.
 */
export function deleteFile(filePath) {
    try {
        fs.unlinkSync(filePath);
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

/**
 * Cleans a string by removing special characters, multiple spaces, and bullets.
 * @param {string} inputString - The string to clean.
 * @returns {string} - The cleaned string.
 */
export function cleanString(inputString) {
    let cleanedString = inputString.replace(/[^\w\s]/gi, '');  // Remove special characters
    cleanedString = cleanedString.replace(/\s{2,}/g, ' ');     // Remove multiple spaces
    cleanedString = cleanedString.replace(/•/g, '');            // Remove bullet characters
    return cleanedString;
}
