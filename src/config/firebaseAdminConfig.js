import admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs'

dotenv.config();

const serviceAccount = JSON.parse(readFileSync(process.env.KEY_FILE, "utf-8"));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

export const verifyFirebaseToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        console.log("token" + token);
        req.user = decodedToken;  // Attach user data to request
        console.log("user" + req.user);
        next(); // Proceed to the next middleware
    } catch (error) {
        return res.status(403).json({ error: "Unauthorized: Invalid token" });
    }
};
