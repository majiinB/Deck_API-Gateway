import openai from '../config/openaiConfig.js';
import { delay } from '../utils/utils.js';

export const getOpenAiResponse = async (thread_id, run_id) => {
    const MAX_TRIES = 5;
    let status = 'queued';
    let tries = 0;

    // Retry loop to monitor the status of the run
    while (status !== 'completed' && tries < MAX_TRIES) {
        try {
            let retrieve = await openai.beta.threads.runs.retrieve(thread_id, run_id);
            status = retrieve.status;
            tries++;

            // Delay before retrying
            await delay(1500);
        } catch (error) {
            console.error(`Error retrieving status: ${error.message}`);
            return { status: 500, error: 'Error retrieving run status.' };
        }
    }

    // Return error if max tries reached
    if (status !== 'completed' && tries === MAX_TRIES) {
        return {
            status: 425,
            error: `An error occurred and your request is not completed. Please try again.`,
            tries,
            expectedStatus: 'completed',
            currentStatus: status
        };
    }

    // If status is 'completed', retrieve messages
    try {
        const response = await openai.beta.threads.messages.list(thread_id);

        const parsedMessages = [];
        const unparsedMessages = [];

        response.body.data.forEach((message) => {
            const content = message.content[0]; // Assumes each message has only one content object
            if (content?.type === 'text' && content?.text?.value) {
                try {
                    parsedMessages.push(JSON.parse(content.text.value));
                } catch (error) {
                    unparsedMessages.push(content.text.value);
                }
            }
        });

        console.log('Unparsed messages:', unparsedMessages);

        return { status: 200, data: parsedMessages };
    } catch (error) {
        console.error(`Error retrieving messages: ${error.message}`);
        return { status: 502, error: error.message };
    }
};