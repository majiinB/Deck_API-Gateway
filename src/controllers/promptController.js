import { promptGemini, promptOpenAI } from '../services/promptService.js';
import { isValidInteger } from '../utils/utils.js';

export const geminiPromptController = async (req, res) => {
    const { subject, topic, fileName, numberOfQuestions } = req.body;

    // Validate input: Either file or both subject and topic are required
    if (!fileName && (!subject || !topic)) {
        return res.status(400).send('Subject or topic is required if no file is uploaded.');
    }

    // Validate the number of questions
    if (!isValidInteger(numberOfQuestions)) {
        return res.status(422).send('Invalid number of questions. It must be between 2 and 20.');
    }

    const result = await promptGemini(req);

    if (result.data) {
        return res.status(result.status).json(result.data)
    } else {
        return res.status(result.status).send(result.message)
    }

}

export const openAiPromptController = async (req, res) => {
    const { subject, topic, pdfFileName, numberOfQuestions, isNewMessage } = req.body;

    // Validate input: Either PDF or both subject and topic are required
    if (!pdfFileName && (!subject || !topic)) {
        return res.status(418).send('We need a message');
    }

    // Validate isNewMessage as a boolean
    if (isNewMessage !== true && isNewMessage !== false) {
        return res.status(419).send('isNewMessage must be true or false');
    }

    // Validate the number of questions
    if (!isValidInteger(numberOfQuestions)) {
        return res.status(420).send('Invalid number of questions. It must be a number between 2 and 20.');
    }

    const result = await promptOpenAI(req);

    if (result.data) {
        return res.status(result.status).json(result.data);
    } else {
        return res.status(result.status).send(result.message);
    }

}