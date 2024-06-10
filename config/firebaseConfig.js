import * as dotenv from 'dotenv';
dotenv.config();
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY.toString(),
    authDomain: process.env.AUTH_DOMAIN.toString(),
    projectId: process.env.PROJECT_ID.toString(),
    storageBucket: process.env.STORAGE_BUCKET.toString(),
    messagingSenderId: process.env.MESSAGING_SENDER_ID.toString(),
    appId: process.env.APP_ID.toString()
};

export default firebaseConfig;

