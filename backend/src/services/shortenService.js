import { pool } from '../config/db.js';
import { getShortCodeFromPool } from '../config/redis.js';

export async function createShortLink({ payload, type }) {
  // 1. Check for duplicates (using the public schema to avoid errors)
  const duplicateQuery = await pool.query(
    'SELECT short_url FROM public.short_links WHERE payload = $1 AND type = $2 AND expires_at > NOW()',
    [payload, type]
  );
  
  let shortUrl = duplicateQuery.rows[0]?.short_url;

  // 2. If it doesn't exist, generate and save it
  if (!shortUrl) {
    shortUrl = await getShortCodeFromPool();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 1 month
    
    await pool.query(`
      INSERT INTO public.short_links (short_url, type, payload, expires_at)
      VALUES ($1, $2, $3, $4)
    `, [shortUrl, type, payload, expiresAt]);
  }

  // 3. THE FIX: Point to your local backend server, NOT the internet
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'; 
  
  // Return ONLY the link string. The frontend will handle the drawing.
  return {
    shortLink: `${BASE_URL}/${shortUrl}`
  };
}