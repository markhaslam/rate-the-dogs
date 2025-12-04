import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { addSessionIdCookie } from './middleware/session-id-cookie.js';
import { images } from './controllers/images.js';
import { ratings } from './controllers/ratings.js';
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

const PORT = process.env.PORT || 3000;
const ORIGIN = process.env.ORIGIN || 'http://localhost:5500';

const corsOptions = {
  origin: ORIGIN,
  credentials: true,
};

app.set('trust proxy', true);

app.use(cors(corsOptions));
app.use(cookieParser(process.env.COOKIE_SECRET), addSessionIdCookie);

app.get('/images', images.getAll);
app.get('/images/random', images.getRandom);
app.get('/images/file/random', images.getRandomFile);
app.get('/images/file/:id', images.getFile);
app.get('/images/:id', images.getOne);
app.get('/images/:id/ratings', ratings.getAllForImage);
app.post('/images/ratings', express.json(), ratings.create);

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
