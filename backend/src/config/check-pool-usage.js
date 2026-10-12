// check-pool-usage.js
import { createClient } from 'redis';

async function check() {
  const redis = createClient({ url: 'redis://localhost:6379' });
  
  try {
    await redis.connect();
    
    console.log("=== BEFORE creating link ===");
    console.log("Redis Pool size:", await redis.sCard('short_codes_pool'));

    // Create one test link
    const res = await fetch('http://localhost:3000/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload: "https://test-" + Date.now() + ".com",
        type: "url",
        nickname: "TestUser"
      })
    });

    const data = await res.json();
    console.log("\n✅ Created short link:", data.data.shortLink);
    console.log("Short code:", data.data.shortLink.split('/').pop());

    console.log("\n=== AFTER creating link ===");
    console.log("Redis Pool size now:", await redis.sCard('short_codes_pool'));

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await redis.quit();
  }
}

check();