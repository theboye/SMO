import { pool } from '../config/db.js';
import { getPreGeneratedCode } from '../config/redis.js';

export async function createShortLink(req, res) {
    const { payload, type, nickname } = req.body;
    const ip = req.ip;

    if (!payload || !type) {
        return res.status(400).json({ 
            status: "error", 
            message: "payload и type обязательны" 
        });
    }

    try {
        // 1. Ensure User exists
        let user = await pool.query('SELECT id FROM users WHERE ip_address = $1', [ip]);
        if (user.rows.length === 0) {
            user = await pool.query(
                'INSERT INTO users (ip_address, nickname) VALUES ($1, $2) RETURNING id', 
                [ip, nickname || 'Guest']
            );
        }
        const userId = user.rows[0].id;

        // 2. DUPLICATE CHECK
        const table = type === 'url' ? 'short_links' : 'non_link_content';
        const existingCheck = await pool.query(
            `SELECT short_code FROM ${table} WHERE payload = $1 AND expires_at > NOW() LIMIT 1`,
            [payload]
        );

        if (existingCheck.rows.length > 0) {
            const oldCode = existingCheck.rows[0].short_code;
            const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
            return res.status(200).json({
                status: "success",
                data: { shortLink: `${BASE_URL}/${oldCode}`, reused: true }
            });
        }

        // 3. Generate new code
        const shortCode = await getPreGeneratedCode();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        if (type === 'url') {
            await pool.query(
                'INSERT INTO short_links (short_code, type, payload, user_id, expires_at) VALUES ($1, $2, $3, $4, $5)',
                [shortCode, type, payload, userId, expiresAt]
            );
        } else {
            // ←←← ИСПРАВЛЕНИЕ ЗДЕСЬ
            await pool.query(
                'INSERT INTO non_link_content (short_code, content_type, payload, user_id, expires_at) VALUES ($1, $2, $3, $4, $5)',
                [shortCode, type, payload, userId, expiresAt]   // type должен быть строкой
            );
        }

        const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
        res.status(201).json({
            status: "success",
            data: { shortLink: `${BASE_URL}/${shortCode}`, reused: false }
        });

    } catch (err) {
        console.error('Creation Error:', err);
        res.status(500).json({ 
            status: "error", 
            message: err.message || "Creation failed" 
        });
    }
}