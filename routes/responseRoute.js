import express from 'express';
import openai from '../config/openaiConfig.js'
import { delay } from '../functions/utils.js'

const router = express.Router();

router.get('/v1/openAI/:id', async (req, res) => {
    const { id } = req.params;
    const { thread_id, run_id } = req.query;
    const MAX_TRIES = 5;
    let status = 'queued';
    let tries = 0;

    // Loop until the status is not 'queued' or until a maximum number of tries is reached
    while (status != 'completed' && tries < MAX_TRIES) {
        // Retrieve status
        let retrieve = await openai.beta.threads.runs.retrieve(thread_id, run_id);

        status = retrieve.status;
        tries++;

        // Add a delay before making the next retrieval
        await delay(1500);
    }

    // Shield
    if (status != 'completed' && tries == MAX_TRIES) {
        return res.status(425).send({
            message: `An Error Occured and your Request is not Completed Please try again.\n
            No. of tries made ${tries}\nexpected status: completed\ncurrent tatus: ${status}`
        });
    }

    //Retrieve message
    if (status == 'completed') {
        try {
            // Retrieve messages from the thread
            const response = await openai.beta.threads.messages.list(thread_id);
            console.log(response); // For debugging

            // Array to store parsed JSON objects
            const parsedMessages = [];
            const unparsedMessage = [];

            // Loop to parse data to JSON format
            response.body.data.forEach((response) => {
                const content = response.content[0]; // Assuming there's only one content object
                if (content && content.type === 'text' && content.text && content.text.value) {
                    try {
                        const parsedContent = JSON.parse(content.text.value);
                        parsedMessages.push(parsedContent);
                    } catch (error) {
                        // If parsing fails, skip this message and push it to the other array
                        unparsedMessage.push(content.text.value)
                    }
                }
            });

            console.log("message: " + unparsedMessage); // Chances are eto yung prompt - for debugging

            // Return the parsed messages in JSON format
            res.status(200).json(parsedMessages);

        } catch (error) {
            // Handle errors
            res.status(502).json({ error: error.message });
        }
    }
});

//router.get('/v2/gemini/:id')

export default router;