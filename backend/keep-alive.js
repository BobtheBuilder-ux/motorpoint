const https = require('https');
const http = require('http');

// Configuration
const SERVER_URL = 'https://motorpoint.onrender.com/api/health';
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes in milliseconds
const TIMEOUT = 30000; // 30 seconds timeout

// Logging utility
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${message}`);
}

// Function to ping the server
function pingServer() {
  return new Promise((resolve, reject) => {
    const url = new URL(SERVER_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'MotorTech-KeepAlive/1.0',
        'Accept': 'text/html,application/json,*/*'
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            statusCode: res.statusCode,
            responseTime: Date.now() - startTime,
            dataLength: data.length
          });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    });
    
    const startTime = Date.now();
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${TIMEOUT}ms`));
    });
    
    req.setTimeout(TIMEOUT);
    req.end();
  });
}

// Main keep-alive function
async function keepAlive() {
  try {
    log(`Pinging server: ${SERVER_URL}`);
    const result = await pingServer();
    log(`✅ Ping successful - Status: ${result.statusCode}, Response time: ${result.responseTime}ms, Data: ${result.dataLength} bytes`, 'SUCCESS');
  } catch (error) {
    log(`❌ Ping failed: ${error.message}`, 'ERROR');
    
    // Log additional error details for debugging
    if (error.code) {
      log(`Error code: ${error.code}`, 'ERROR');
    }
    if (error.errno) {
      log(`Error number: ${error.errno}`, 'ERROR');
    }
  }
}

// Graceful shutdown handling
process.on('SIGINT', () => {
  log('Received SIGINT, shutting down gracefully...', 'INFO');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM, shutting down gracefully...', 'INFO');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`, 'FATAL');
  log(error.stack, 'FATAL');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled rejection at: ${promise}, reason: ${reason}`, 'FATAL');
  process.exit(1);
});

// Start the keep-alive service
log('🚀 MotorTech Keep-Alive Service starting...', 'INFO');
log(`Server URL: ${SERVER_URL}`, 'INFO');
log(`Ping interval: ${PING_INTERVAL / 1000 / 60} minutes`, 'INFO');
log(`Request timeout: ${TIMEOUT / 1000} seconds`, 'INFO');

// Initial ping
keepAlive();

// Set up interval for periodic pings
const intervalId = setInterval(keepAlive, PING_INTERVAL);

log('✅ Keep-alive service is running. Press Ctrl+C to stop.', 'INFO');

// Keep the process alive
process.stdin.resume();