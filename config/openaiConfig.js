import { OpenAI } from "openai";
import * as dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY.toString(),
});

export const assistant = await openai.beta.assistants.retrieve(process.env.ASSISTANT_ID.toString());

export default openai;