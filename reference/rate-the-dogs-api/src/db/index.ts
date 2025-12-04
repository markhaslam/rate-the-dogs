import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool();

export function query(text: string, params?: string[]) {
  return pool.query(text, params);
}
