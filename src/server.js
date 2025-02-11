/**
 * Deck API
 * 
 * @file server.js
 * @description This is the main entry point for the Deck API.
 * 
 * To start the server, run this file. The server will listen on the specified port.
 * 
 * @module server
 * 
 * @author Arthur M. Artugue
 * @created 2025-11-02
 * @updated 2025-11-02
 */

import * as dotenv from 'dotenv';
import app from './app.js'

dotenv.config();

// Instantiate Objects
const PORT = process.env.PORT || 3000;

// FIRE UP THE API
app.listen(PORT, () => {
    console.log(`Deck API is now listening to http://localhost:${PORT}`);
})
