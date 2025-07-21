#!/usr/bin/env node

/**
 * Simple automatic processor for scheduled questionnaires - PORT 3000
 * Runs curl every minute to process due sends
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const PROCESS_ENDPOINT = 'http://localhost:3000/api/test/process-fast';
const CHECK_INTERVAL = 60 * 1000; // Check every 60 seconds

let processCount = 0;

console.log('🤖 Starting Automatic Questionnaire Processor (PORT 3000)...');
console.log(`⏰ Checking for due sends every ${CHECK_INTERVAL / 1000} seconds`);
console.log(`🎯 Endpoint: ${PROCESS_ENDPOINT}`);
console.log(`📧 Perfect for testing 10-minute recurrence!`);
console.log('\n🛑 Press Ctrl+C to stop\n');

async function processScheduledSends() {
  const now = new Date().toLocaleTimeString();
  
  try {
    console.log(`🔄 [${now}] Checking for due sends...`);
    
    const { stdout, stderr } = await execPromise(`curl -s -X POST ${PROCESS_ENDPOINT}`);
    
    if (stderr) {
      console.log(`❌ [${now}] Error: ${stderr}`);
      return;
    }
    
    const result = JSON.parse(stdout);
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
            if (r.link) {
              console.log(`   🔗 Link: ${r.link}`);
            }
          }
        });
      }
      console.log(''); // Empty line for readability
      
    } else {
      console.log(`ℹ️  [${now}] No sends due for processing (${processCount} checks total)`);
    }
    
  } catch (error) {
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
  process.exit(0);
});

process.on('SIGTERM', () => {
  clearInterval(interval);
  process.exit(0);
});
