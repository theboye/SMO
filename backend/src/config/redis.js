// config/redis.js
import { createClient } from 'redis';
import crypto from 'crypto';

export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.error('❌ Redis Error:', err));
redisClient.on('connect', () => console.log('✅ Redis connected'));

export const initRedis = async () => {
  await redisClient.connect();
  
  const type = await redisClient.type('short_codes_pool');
  console.log(`🔑 short_codes_pool type: ${type} | Size: ${await redisClient.sCard('short_codes_pool')}`);

  await refillCodePool();
};

async function refillCodePool() {
  const currentSize = await redisClient.sCard('short_codes_pool');

  if (currentSize >= 300) {
    console.log(`📦 Pool is healthy (${currentSize} codes)`);
    return;
  }

  const codesToAdd = [];
  const target = 800 - currentSize;

  for (let i = 0; i < target; i++) {
    // Generate nice 10-character code (base64url = URL safe)
    const code = crypto.randomBytes(8).toString('base64url').slice(0, 10);
    codesToAdd.push(code);
  }

  await redisClient.sAdd('short_codes_pool', codesToAdd);
  console.log(`🔄 Added ${target} new codes. New pool size: ${await redisClient.sCard('short_codes_pool')}`);
}

export const getPreGeneratedCode = async () => {
  try {
    let code = await redisClient.sPop('short_codes_pool');

    if (!code) {
      console.warn('⚠️ Pool was empty → refilling');
      await refillCodePool();
      code = await redisClient.sPop('short_codes_pool');
    }

    // Refill in background if low
    if (await redisClient.sCard('short_codes_pool') < 150) {
      refillCodePool().catch(console.error);
    }

    return code;
  } catch (err) {
    console.error('❌ Failed to get code from Redis:', err);
    return fallbackGenerateCode();
  }
};

function fallbackGenerateCode(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}