// testers/load-test.js
import autocannon from 'autocannon';
import { faker } from '@faker-js/faker';

const BASE_URL = 'http://localhost:3000';

console.log('🚀 Starting Load Test...\n');

const instance = autocannon({
  url: BASE_URL,
  connections: 25,
  duration: 30,
  pipelining: 1,
  requests: [
    {
      method: 'POST',
      path: '/api/shorten',
      headers: { 
        'content-type': 'application/json' 
      },
      body: JSON.stringify({
        payload: faker.internet.url(),
        type: 'url',
        nickname: faker.internet.username()   // ← Fixed here
      })
    },
    {
      method: 'GET',
      path: '/test'
    }
  ]
});

autocannon.track(instance, { renderProgressBar: true });

instance.on('done', (result) => {
  console.log('\n✅ === LOAD TEST RESULTS ===\n');
  console.log(`Total Requests     : ${result.requests.total}`);
  console.log(`Average RPS        : ${result.requests.average.toFixed(2)}`);
  console.log(`Latency Avg        : ${result.latency.average.toFixed(2)} ms`);
  console.log(`Latency p95        : ${result.latency.p95} ms`);
  console.log(`Latency p99        : ${result.latency.p99} ms`);
  console.log(`Errors             : ${result.errors}`);
  console.log(`Timeouts           : ${result.timeouts}`);
});