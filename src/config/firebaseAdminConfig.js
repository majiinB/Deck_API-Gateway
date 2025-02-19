import admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

const serviceAccount = require(process.env.KEY_FILE);

export const admin = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})