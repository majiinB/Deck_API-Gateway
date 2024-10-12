import express from 'express';
import openai, { assistant } from '../config/openaiConfig.js'
import { createThread, extractPdfText, downloadPdf, deleteFile, isValidInteger, cleanString } from '../functions/utils.js'
import { initializeApp } from 'firebase/app';
import config from '../config/firebaseConfig.js'

const router = express.Router();

// Initialize firebase app
initializeApp(config);

router.post('/v1/openAI/:id', async (req, res) => {
    const { id } = req.params;
    const { subject } = req.body;
    const { topic } = req.body;
    const { addDescription } = req.body;
    const { pdfFileName } = req.body;
    const { numberOfQuestions } = req.body;
    const { isNewMessage } = req.body;
    const { threadID } = req.body;

    // Shield
    if (!pdfFileName) {
        if (!subject || !topic) {
            return res.status(418).send('We need a message');
        }
    }

    if (isNewMessage !== true && isNewMessage !== false) {
        return res.status(419).send('Condition to indicate if new message must be true or false');
    }

    if (!isValidInteger(numberOfQuestions)) {
        return res.status(420).send('You have enetered an invalid input for the number of flashcards to be generated\nYour input should be of numerical value that ranges from 2-20');
    }

    // Initialize prompt and pdfInfo
    let prompt = `Instructions: give me ${numberOfQuestions} questions with answers.`;
    let pdfInfo = 'Source of information to use:';
    let lastLinePrompt = `Do not repeat questions. Also make the questions 1-2 sentences max and the answers 1 sentence max or the keypoint only`;

    // extract info from pdf
    if (pdfFileName) {
        try {
            const filePath = await downloadPdf(pdfFileName, id);
            let extractedText = await extractPdfText(filePath);
            if (!extractedText) {
                return res.status(421).send(
                    "Pdf data extraction error: Please check your pdf file, and please refrain from using Pdf that was converted from Ppt"
                );
            } else {
                if (deleteFile(filePath)) {
                    pdfInfo += extractedText;
                } else {
                    return res.status(422).send(
                        "Pdf server data deletion error"
                    );
                }
            }
        } catch (error) {
            console.error('Error extracting PDF text:', error);
            return res.status(501).send(
                'An error occurred while extracting PDF text',
            );
        }
    }

    // Condition to determine prompt
    if (pdfFileName) {
        if (!subject && !topic && !addDescription) {
            prompt += pdfInfo;
        } else {
            if (subject) prompt += `the subject is ${subject}. `;
            if (topic) prompt += `and the topic is ${topic}. `;
            if (addDescription) prompt += `Additional description: ${addDescription}. `;
            prompt += pdfInfo;
        }
    } else {
        if (!subject || !topic) {
            // Subject and topic are required if no PDF is uploaded
            return res.status(423).send({ message: 'Subject and topic are required.' });
        } else {
            if (subject) prompt += `the subject is ${subject}. `;
            if (topic) prompt += `and the topic is ${topic}. `;
            if (addDescription) prompt += `Additional description: ${addDescription}. `;
        }
    }

    prompt += lastLinePrompt;

    /* Ganto mukha nung prompt kung lahat ng info meron
    *  prompt = `Instructions: give me ${numberOfQuestions} questions with answers. the subject is ${subject} and the topic is ${topic}.`
    *  + ` Additional description: ${addDescription}. ` + `Source of information to use: ${pdfInfo} ` +
    *  `Do not repeat questions. Also make the questions 1-2 sentences max and the answers 1 sentence max or the keypoint only`
    */

    // Success
    try {
        // Create or retrieve thread
        const thread = await createThread(isNewMessage, threadID);

        // Create messsage
        await openai.beta.threads.messages.create(thread, {
            role: "user",
            content: prompt,
        });

        // Run assisstant
        const run = await openai.beta.threads.runs.create(thread, {
            assistant_id: assistant.id,
            instructions: "I want you to act as a Professor providing students with questions and answers but strictly, answer in JSON format and no introductory sentences, write it like a code generator." +
                "the format is {questions:{question: 1+1, answer: 2}, {question:2+3, answer:5}}" +
                "Also if the message is any of the following: " +
                "1.the message is not about academics. " +
                "2.the given informations did not align or did not make sense. " +
                "3.message is to vague. " +
                "4.the message is vulgar. " +
                "5.the message involves getting personal information. " +
                "return an empty JSON"
        })

        return res.status(200).send({
            thread_id: await run.thread_id,
            run_id: await run.id
        });

    } catch (error) {
        return res.status(424).send('An error occured in message route prompt process');
    }
});

router.post('/v2/gemini/:id', (req, res) => {

});

export default router;