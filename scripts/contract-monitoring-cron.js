#!/usr/bin/env node

/**
 * Contract Monitoring Cron Job
 * 
 * This script can be run as a cron job to automatically monitor contract expirations
 * and process auto-renewals.
 * 
 * Usage:
 * node scripts/contract-monitoring-cron.js [action]
 * 
 * Actions:
 * - check-expirations: Check for expiring contracts and send notifications
 * - process-renewals: Process automatic renewals
 * - full-monitoring: Run both checks (default)
 */

const https = require('https');
const http = require('http');

// Configuration
const config = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8090',
  cronToken: process.env.CRON_SECRET_TOKEN,
  action: process.argv[2] || 'full-monitoring'
};

async function runMonitoring() {
  return new Promise((resolve, reject) => {
    const url = new URL('/api/contracts/automated-monitoring', config.baseUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const postData = JSON.stringify({
      action: config.action
    });

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...(config.cronToken ? { 'Authorization': `Bearer ${config.cronToken}` } : {})
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (res.statusCode === 200) {
            resolve(result);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${result.error || 'Unknown error'}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    console.log(`[${new Date().toISOString()}] Starting contract monitoring: ${config.action}`);
    
    const result = await runMonitoring();
    
    console.log(`[${new Date().toISOString()}] Contract monitoring completed successfully:`);
    console.log(JSON.stringify(result, null, 2));
    
    // Exit with success
    process.exit(0);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Contract monitoring failed:`, error.message);
    
    // Exit with error
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { runMonitoring };
