import express from 'express';
import messageRoute from './routes/promptRoute.js';
import responseRoute from './routes/responseRoute.js';
import { getIPAddress } from './functions/utils.js';

// INSTANTIATE OBJECTS AND REQUIREMENTS
const PORT = 3000;
//const IP = getIPAddress();
const app = express();

// MIDDLEWARE
/*
 * To parse and read body to json
 */
app.use(express.json());

//END POINTS
app.use('/prompt', messageRoute);
app.use('/response', responseRoute);
app.get('/hi', async (req, res) => {
    console.log('someone said hi');
    return res.status(200).send('Hello I\'m Online!');
});

// FIRE UP THE API
app.listen(PORT, () => {
    console.log(`Deck API is now listening to http://localhost:${PORT}`);
})

