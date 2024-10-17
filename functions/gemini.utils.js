import { model } from '../config/geminiConfig.js';
import { fileManager } from '../config/geminiConfig.js';
import { Storage } from '@google-cloud/storage';
import mime from 'mime';
import * as dotenv from 'dotenv';

dotenv.config();

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
    try{

    }catch(err){
        
    };
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