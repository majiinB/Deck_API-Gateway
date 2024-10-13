import openai from '../config/openaiConfig.js';
import { Storage } from '@google-cloud/storage';
import { PDFExtract } from 'pdf.js-extract';
import fs from 'fs';
import * as dotenv from 'dotenv';
import os from 'os';
dotenv.config();

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

