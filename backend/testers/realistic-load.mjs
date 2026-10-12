import autocannon from 'autocannon';

autocannon({
  url: 'http://localhost:3000',
  connections: 120,
  duration: 60,
  requests: [
    {
      method: 'POST',
      path: '/api/shorten',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        payload: 'https://example.com/' + Math.random().toString(36).substring(2),
        type: 'url'
      })
    },
    {
      method: 'GET',
      path: '/test'
    }
  ]
}, (err, result) => {
  if (err) {
    console.error('Test error:', err);
    return;
  }

  console.log('\n=== 🎯 FINAL LOAD TEST RESULTS ===');
  console.table({
    'Avg RPS': result.requests.average.toFixed(1),
    'Total Requests': result.requests.total,
    '2xx Responses': result['2xx'],
    '429 Rate Limited': result.statusCodeStats?.['429']?.count || 0,
    'Avg Latency (ms)': result.latency.average.toFixed(1),
    'p95 Latency (ms)': result.latency.p95 || 'N/A',
    'p99 Latency (ms)': result.latency.p99 || 'N/A',
    'Max Latency (ms)': result.latency.max
  });
});