import fs from 'fs';
import { monitorEventLoopDelay } from 'perf_hooks';

const histogram = monitorEventLoopDelay();
histogram.enable();

const logs = [];
console.log("🌡️ Internal Hardware Monitor Started...");

const interval = setInterval(() => {
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();
    
    logs.push({
        time: new Date().toLocaleTimeString(),
        // Internal Bottleneck 1: Memory pressure
        heapMB: (mem.heapUsed / 1024 / 1024).toFixed(2),
        // Internal Bottleneck 2: Event Loop Delay (Critical for Node.js)
        loopDelay: (histogram.mean / 1e6).toFixed(2),
        // Internal Bottleneck 3: CPU Usage
        cpuTotal: ((cpu.user + cpu.system) / 1000000).toFixed(2)
    });
    
    fs.writeFileSync('./telemetry-data.json', JSON.stringify(logs, null, 2));
}, 1000);

process.on('SIGINT', () => {
    clearInterval(interval);
    console.log("\n💾 Telemetry saved to testers/telemetry-data.json");
    process.exit();
});