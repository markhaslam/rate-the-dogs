import { query } from '../db/index.js';
import { Request, Response } from 'express';

const _getByImageId = async (req: Request, res: Response) => {
  try {
    const sql = `SELECT *
                FROM ratings
                WHERE image_id = $1
                ORDER BY id DESC;`;
    const sqlArgs = [req.params.id];
    const results = await query(sql, sqlArgs);
    res.json({ rows: results.rows, rowCount: results.rowCount });
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
};

const _getByUrl = async (req: Request, res: Response) => {
  try {
    const sql = `SELECT *
                FROM ratings
                WHERE image_id = (SELECT id FROM images WHERE url = $1)
                ORDER BY id DESC;`;
    const decodedUrl = decodeURIComponent(req.params.id.split('=')[1]);
    const sqlArgs = [decodedUrl];
    const results = await query(sql, sqlArgs);
    res.json({ rows: results.rows, rowCount: results.rowCount });
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
};

const getAllForImage = async (req: Request, res: Response) => {
  if (req.params.id.substring(0, 4) === 'url=') {
    _getByUrl(req, res);
  } else {
    _getByImageId(req, res);
  }
};

const _createUsingImageId = async (req: Request, res: Response) => {
  try {
    const sql = `INSERT INTO ratings 
                (id, image_id, rating, session_id, ip_address, user_agent, created_at)
                VALUES (
                        DEFAULT,
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        NOW()
                    )
                RETURNING *;`;
    const sqlArgs = [
      req.body.image_id,
      req.body.rating,
      req.signedCookies.sid || null,
      req.ip,
      req.headers['user-agent'] || null,
    ];
    const results = await query(sql, sqlArgs);
    res.status(201).json(results.rows[0]);
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
};

const _createUsingUrl = async (req: Request, res: Response) => {
  try {
    const sql = `INSERT INTO ratings 
                (id, image_id, rating, session_id, ip_address, user_agent, created_at)
                VALUES (
                        DEFAULT,
                        (SELECT id FROM images WHERE url = $1),
                        $2,
                        $3,
                        $4,
                        $5,
                        NOW()
                    )
                RETURNING *;`;
    const sqlArgs = [
      req.body.image_url,
      req.body.rating,
      req.signedCookies.sid || null,
      req.ip,
      req.headers['user-agent'] || null,
    ];
    const results = await query(sql, sqlArgs);
    res.status(201).json(results.rows[0]);
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
};

const create = async (req: Request, res: Response) => {
  if (req.body.image_url) {
    _createUsingUrl(req, res);
  } else {
    _createUsingImageId(req, res);
  }
};

export const ratings = {
  getAllForImage,
  create,
};
