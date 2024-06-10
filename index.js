import express from 'express';
import messageRoute from './routes/messageRoute.js';
import responseRoute from './routes/responseRoute.js';
import { getIPAddress } from './functions/utils.js';

// INSTANTIATE OBJECTS AND REQUIREMENTS
const PORT = 8080;
const IP = getIPAddress();
const app = express();

// MIDDLEWARE
/*
 * To parse and read body to json
 */
app.use(express.json());

//END POINTS
app.use('/message', messageRoute);
app.use('/response', responseRoute);

// FIRE UP THE API
app.listen(PORT, IP, () => {
    console.log(`Deck API is now listening to http://${IP}:${PORT}`);
})

