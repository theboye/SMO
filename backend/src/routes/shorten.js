import express from 'express';
import { createShortLink } from '../controllers/shortenController.js';

const router = express.Router();

router.post('/shorten', createShortLink);

export default router;