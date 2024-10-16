import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai'
import { GoogleAIFileManager } from '@google/generative-ai/server';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY.toString();

export const fileManager = new GoogleAIFileManager(apiKey);
export const genAI = new GoogleGenerativeAI(apiKey);
export const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
};



