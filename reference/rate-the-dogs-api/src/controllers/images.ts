import { query } from '../db/index.js';
import { Request, Response } from 'express';
import { default as axios } from 'axios';

// Only includes images that have been rated
const _getAllDefault = async (req: Request, res: Response) => {
  try {
    const sql = `SELECT i.id,
                        i.url,
                        i.breed,
                        AVG(r.rating) as average_rating,
                        COUNT(r.rating) as total_ratings
                FROM images i
                    JOIN ratings r ON i.id = r.image_id
                GROUP BY i.id, i.url, i.breed
                ORDER BY total_ratings DESC, i.id;`;
    const results = await query(sql);
    res.json({ rows: results.rows, rowCount: results.rowCount });
  } catch (error) {
    res.status(400).send({ message: (error as Error).message });
  }
};

const _getAllIncludeUnrated = async (req: Request, res: Response) => {
  try {
    const sql = `SELECT i.id,
                        i.url,
                        i.breed,
                        AVG(r.rating) as average_rating,
                        COUNT(r.rating) as total_ratings
                FROM images i
                    LEFT JOIN ratings r ON i.id = r.image_id
                GROUP BY i.id, i.url, i.breed
                ORDER BY total_ratings DESC, i.id;`;
    const results = await query(sql);
    res.json({ rows: results.rows, rowCount: results.rowCount });
  } catch (error) {
    res.status(400).send({ message: (error as Error).message });
  }
};

const getAll = async (req: Request, res: Response) => {
  if (req.query['include-unrated'] === 'true') {
    _getAllIncludeUnrated(req, res);
  } else {
    _getAllDefault(req, res);
  }
};

const _getById = async (req: Request, res: Response) => {
  try {
    const sql = `SELECT i.id,
                        i.url,
                        i.breed,
                        AVG(r.rating) as average_rating,
                        COUNT(r.rating) as total_ratings
                FROM images i
                    LEFT JOIN ratings r ON r.image_id = i.id
                WHERE i.id = $1
                GROUP BY i.id, i.url, i.breed;`;
    const sqlArgs = [req.params.id];
    const results = await query(sql, sqlArgs);
    results.rows[0]
      ? res.json(results.rows[0])
      : res.status(404).json({ message: 'image not found' });
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
};

const _getByUrl = async (req: Request, res: Response) => {
  try {
    const sql = `SELECT i.id,
                        i.url,
                        i.breed,
                        AVG(r.rating) as average_rating,
                        COUNT(r.rating) as total_ratings
                FROM images i
                    LEFT JOIN ratings r ON r.image_id = i.id
                WHERE i.url = $1
                GROUP BY i.id, i.url, i.breed;`;
    //remove the 'url=' then decode url
    const decodedUrl = decodeURIComponent(req.params.id.split('=')[1]);
    const sqlArgs = [decodedUrl];
    const results = await query(sql, sqlArgs);
    results.rows[0]
      ? res.json(results.rows[0])
      : res.status(404).json({ message: 'image not found' });
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
};

const getOne = async (req: Request, res: Response) => {
  if (req.params.id.substring(0, 4) === 'url=') {
    _getByUrl(req, res);
  } else {
    _getById(req, res);
  }
};

const _getFileById = async (req: Request, res: Response) => {
  try {
    const sql = `SELECT url
                FROM images
                WHERE id = $1`;
    const sqlArgs = [req.params.id];
    const results = await query(sql, sqlArgs);
    let url;
    if (results.rows[0]) {
      ({ url } = results.rows[0]);
    } else {
      return res.status(404).json({ message: 'image not found' });
    }
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });
    res.set('Content-Type', 'image/jpeg');
    res.send(response.data);
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
};

const _getFileByUrl = async (req: Request, res: Response) => {
  try {
    //remove the 'url=' then decode url
    const decodedUrl = decodeURIComponent(req.params.id.split('=')[1]);
    const response = await axios.get(decodedUrl, {
      responseType: 'arraybuffer',
    });
    res.set('Content-Type', 'image/jpeg');
    res.send(response.data);
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
};

const getFile = async (req: Request, res: Response) => {
  if (req.params.id.substring(0, 4) === 'url=') {
    _getFileByUrl(req, res);
  } else {
    _getFileById(req, res);
  }
};

const _getRandomAnyHelper = async () => {
  const sql = `SELECT i.id,
                  i.url,
                  i.breed,
                  AVG(r.rating) as average_rating,
                  COUNT(r.rating) as total_ratings
                FROM images i
                  LEFT JOIN ratings r ON r.image_id = i.id
                GROUP BY i.id, i.url, i.breed
                OFFSET floor(random() * (SELECT count(*) from images))
                LIMIT 1`;
  const results = await query(sql);
  return results.rows[0];
};

const _getRandomHelper = async (req: Request) => {
  const sql = `SELECT i.id,
                  i.url,
                  i.breed,
                  AVG(r.rating) as average_rating,
                  COUNT(r.rating) as total_ratings
                FROM images i
                  LEFT JOIN ratings r ON r.image_id = i.id
                WHERE i.id NOT IN (SELECT DISTINCT image_id 
                                  FROM ratings
                                  WHERE session_id = $1)
                AND i.id != ALL ($2)
                GROUP BY i.id, i.url, i.breed                                
                OFFSET floor(random() * (SELECT count(*)
                                        FROM images 
                                        WHERE id NOT IN (SELECT DISTINCT image_id 
                                                        FROM ratings
                                                        WHERE session_id = $1)
                                        AND id != ALL ($2)))
                LIMIT 1`;
  const sid = req.signedCookies.sid;
  let excludedImages: number[] = [];
  // Get the additional image ids to exclude from query string and convert to a number array
  // if none are supplied then an empty array wll be passed as the argument
  if (req.query.exclude) {
    const excludeQueryString: string = req.query.exclude as string;
    excludedImages = excludeQueryString.split(',').map((x) => Number(x));
  }
  const sqlArgs = [sid, excludedImages];
  const results = await query(sql, sqlArgs);
  if (results.rows[0]) return results.rows[0];
  else return _getRandomAnyHelper();
};

// Gets any random image. Called by getRandom if there are no images the
// user hasn't rated, or any=true is passed as a query param to getRandom
const _getRandomAny = async (req: Request, res: Response) => {
  try {
    res.json(await _getRandomAnyHelper());
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
};

// Gets a random image that the user has not rated yet
// if none exist (or any=true is passes as query param) it gets any random image
const getRandom = async (req: Request, res: Response) => {
  try {
    if (req.query.any === 'true') {
      _getRandomAny(req, res);
    } else {
      res.send(await _getRandomHelper(req));
    }
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
};

const getRandomFile = async (req: Request, res: Response) => {
  try {
    let url;
    if (req.query.any === 'true') {
      ({ url } = await _getRandomAnyHelper());
    } else {
      ({ url } = await _getRandomHelper(req));
    }
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    res.set('Content-Type', 'image/jpeg');
    res.send(response.data);
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
};

export const images = {
  getOne,
  getAll,
  getFile,
  getRandom,
  getRandomFile,
};
