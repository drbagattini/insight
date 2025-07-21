#!/usr/bin/env node

/**
 * Automatic processor for scheduled questionnaires
 * Runs every minute to process due sends automatically
 * Perfect for testing 10-minute recurrence
 */

const https = require('https');
const http = require('http');

const PROCESS_ENDPOINT = 'http://localhost:3001/api/test/process-fast';
const CHECK_INTERVAL = 60 * 1000; // Check every 60 seconds

let processCount = 0;
let isRunning = true;

console.log('🤖 Starting Automatic Questionnaire Processor...');
console.log(`⏰ Checking for due sends every ${CHECK_INTERVAL / 1000} seconds`);
console.log(`🎯 Endpoint: ${PROCESS_ENDPOINT}`);
console.log(`📧 Perfect for testing 10-minute recurrence!`);
console.log('\n🛑 Press Ctrl+C to stop\n');

async function processScheduledSends() {
  try {
    const now = new Date().toLocaleTimeString();
    console.log(`🔄 [${now}] Checking for due sends...`);
    
    // Simple curl call
    const { spawn } = require('child_process');
    const curl = spawn('curl', ['-X', 'POST', PROCESS_ENDPOINT]);
    
    let responseData = '';
    
    curl.stdout.on('data', (data) => {
      responseData += data.toString();
    });
    
    await new Promise((resolve, reject) => {
      curl.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`curl failed with code ${code}`));
        } else {
          resolve();
        }
      });
    });
    
    const result = JSON.parse(responseData);
    processCount++;
    
    if (result.processed > 0) {
      console.log(`✅ [${now}] SUCCESS! Processed ${result.processed}/${result.total} sends`);
      
      // Show details of processed sends
      if (result.results && result.results.length > 0) {
        result.results.forEach(r => {
          if (r.status.includes('sent')) {
            console.log(`   📧 ${r.sentTo} - ${r.questionnaire} (${r.frequency})`);
            if (r.nextSend) {
              const nextTime = new Date(r.nextSend).toLocaleTimeString();
              console.log(`   ⏰ Next send: ${nextTime}`);
            }
          }
        });
      }
      console.log(''); // Empty line for readability
      
    } else {
      console.log(`ℹ️  [${now}] No sends due for processing (${processCount} checks total)`);
    }
    
  } catch (error) {
    const now = new Date().toLocaleTimeString();
    console.log(`❌ [${now}] Error:`, error.message);
  }
}

// Initial check
processScheduledSends();

// Set up interval
const interval = setInterval(processScheduledSends, CHECK_INTERVAL);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping automatic processor...');
  console.log(`📊 Total checks performed: ${processCount}`);
  console.log('✅ Automatic processor stopped');
  clearInterval(interval);
  isRunning = false;
  process.exit(0);
});

// Keep alive
process.on('SIGTERM', () => {
  clearInterval(interval);
  isRunning = false;
  process.exit(0);
});
