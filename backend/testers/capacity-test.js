// testers/capacity-test.js
import fs from 'fs';
import autocannon from 'autocannon';

async function runStep(connections) {
  console.log(`\n🔥 Testing with ${connections} concurrent connections...`);

  return new Promise((resolve) => {
    const instance = autocannon({
      url: 'http://localhost:3000',
      connections: connections,
      duration: 20,
      requests: [
        {
          method: 'POST',
          path: '/api/shorten',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            payload: 'https://test-' + Date.now() + '.com',
            type: 'url',
            nickname: 'TestUser'
          })
        },
        { method: 'GET', path: '/test' }
      ]
    });

    autocannon.track(instance, { renderProgressBar: false });

    instance.on('done', (result) => {
      console.log(`   RPS: ${result.requests.average.toFixed(1)} | p95: ${result.latency.p95}ms | Errors: ${result.errors}`);
      resolve(result);
    });
  });
}

async function findCapacity() {
  console.log("🚀 Starting Capacity Test...\n");
  
  const reportData = []; // Array to hold our graph data

  for (let conn = 25; conn <= 400; conn += 25) {
    const result = await runStep(conn);
    
    // Save the data points we care about for the graph
    reportData.push({
      connections: conn,
      rps: result.requests.average,
      latency: result.latency.p95,
      errors: result.errors
    });

    if (result.errors > 50 || result.latency.p95 > 2000) {
      console.log(`\n🛑 Stopping test: System reached its limit at ${conn} connections.`);
      break;
    }
  }

  // Save the collected data to a file
  fs.writeFileSync('report-data.json', JSON.stringify(reportData, null, 2));
  console.log("\n📊 Data saved to 'report-data.json'. Open graph.html to see the chart!");
}

findCapacity();