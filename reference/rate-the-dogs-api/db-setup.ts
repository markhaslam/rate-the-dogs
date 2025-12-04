import 'dotenv/config';
import * as fs from 'node:fs';
import pg from 'pg';

const pool = new pg.Pool();

const getImageObjects = () => {
  const json = fs.readFileSync('./breed-images.json');
  const breedImages = JSON.parse(json.toString());

  return breedImages;
};

const getExistingImageUrls = async () => {
  try {
    const sql = `SELECT url FROM images;`;
    const results = await pool.query(sql);
    const existingUrls = results.rows.map((img) => img.url);
    return existingUrls;
  } catch (error) {
    console.log(error);
  }
};
const executeSql = async () => {
  const existingUrls = await getExistingImageUrls();
  const breedImages = getImageObjects();
  const insertPromises = [];

  try {
    for (const breed in breedImages) {
      for (const url of breedImages[breed]) {
        if (!existingUrls?.includes(url)) {
          insertPromises.push(
            pool.query('INSERT INTO images (url, breed) VALUES ($1, $2)', [
              url,
              breed,
            ]),
          );
        }
      }
    }
    await Promise.all(insertPromises);
    await pool.end();
    console.log('done!');
    console.log(counter.toFixed(2) + ' seconds');
    clearInterval(timerId);
  } catch (error) {
    console.error(error);
  }
};

let counter = 0;
executeSql();
const timerId = setInterval(() => {
  counter += 0.01;
}, 10);
