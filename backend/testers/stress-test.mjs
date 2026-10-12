import autocannon from 'autocannon';

console.log('💀 Запуск АВТОМАТИЧЕСКОГО стресс-теста (до ~95% ошибок)...\n');

async function runStressStep(connections, rate) {
  console.log(`🔥 Тестируем: ${connections} connections | rate: ${rate} RPS`);

  return new Promise((resolve) => {
    autocannon({
      url: 'http://localhost:3000',
      connections: connections,
      duration: 25,
      rate: rate,
      requests: [
        {
          method: 'POST',
          path: '/api/shorten',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            payload: 'https://stress-' + Math.random().toString(36).substring(2) + '.com',
            type: 'url'
          })
        },
        { method: 'GET', path: '/test' }
      ]
    }, (err, result) => {
      if (err) {
        console.error('Error:', err.message);
        return resolve({ connections, rate, errors: 999, failRate: 100 });
      }

      const total = result.requests.total || 0;
      const success = result['2xx'] || 0;
      const failed = total - success;
      const failRate = total > 0 ? (failed / total) * 100 : 0;

      console.log(`   → RPS: ${result.requests.average.toFixed(1)} | Fail: ${failRate.toFixed(1)}% | p99: ${result.latency.p99 || 'N/A'}ms`);

      resolve({
        connections,
        rate,
        rps: result.requests.average,
        failRate,
        p99: result.latency.p99 || 0,
        maxLatency: result.latency.max,
        result
      });
    });
  });
}

async function findBreakingPoint() {
  let connections = 100;
  let rate = 300;

  for (let i = 0; i < 15; i++) {                    // максимум 15 итераций
    const data = await runStressStep(connections, rate);

    if (data.failRate >= 85 || data.p99 > 800 || data.maxLatency > 1500) {
      console.log(`\n🎯 ТОЧКА ОТКАЗА НАЙДЕНА!`);
      console.log(`   Connections: ${data.connections} | Rate: ${data.rate} RPS`);
      console.log(`   Failure Rate: ${data.failRate.toFixed(2)}%`);
      console.log(`   p99 Latency: ${data.p99}ms`);
      break;
    }

    // Увеличиваем нагрузку
    connections += 50;
    rate += 200;
  }

  console.log('\n🏁 Авто-стресс тест завершён.');
}

findBreakingPoint();