import express from 'express';
import { pool } from '../config/db.js';
import { redisClient } from '../config/redis.js';

const router = express.Router();

router.get('/:code', async (req, res) => {
    const { code } = req.params;
    
    // Ignore favicon requests
    if (code === 'favicon.ico') return res.status(204).end();

    try {
        // 1. FAST PATH: Check Redis Cache First
        const cached = await redisClient.get(`url_cache:${code}`);
        if (cached) {
            const data = JSON.parse(cached);
            // If it's a URL, redirect. If it's text/phone, just send the text.
            return data.type === 'url' ? res.redirect(data.payload) : res.send(data.payload);
        }

        console.log(`🐢 Cache Miss for ${code}, asking DB...`);

        // 2. Try the short_links table (Using 'payload' column per your pgAdmin)
        const linkRes = await pool.query(
            'SELECT payload, type FROM short_links WHERE short_code = $1 AND expires_at > NOW()',
            [code]
        );

        if (linkRes.rows.length > 0) {
            const { payload, type } = linkRes.rows[0];
            // Save to cache for 1 hour
            await redisClient.set(`url_cache:${code}`, JSON.stringify({ type, payload }), { EX: 3600 });
            
            // Redirect if it's a URL
            if (type === 'url') {
                return res.redirect(payload);
            }
            return res.send(payload);
        }

        // 3. Try the non_link_content table
        const contentRes = await pool.query(
            'SELECT payload, content_type FROM non_link_content WHERE short_code = $1 AND expires_at > NOW()',
            [code]
        );

        if (contentRes.rows.length > 0) {
            const { payload, content_type } = contentRes.rows[0];
            await redisClient.set(`url_cache:${code}`, JSON.stringify({ type: content_type, payload }), { EX: 3600 });
            
            return res.send(payload);
        }

        res.status(404).send('Link or Content not found');

    } catch (error) {
        console.error('❌ Redirect Error:', error.message);
        res.status(500).send('Server Error');
    }
});

export default router;