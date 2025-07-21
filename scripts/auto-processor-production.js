#!/usr/bin/env node

/**
 * Production Automatic Processor for Scheduled Questionnaire Sends
 * Runs every hour to process due scheduled sends
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SERVER_PORT = process.env.PORT || 3000;
const PROCESS_URL = `http://localhost:${SERVER_PORT}/api/envios_programados/process`;
const LOG_FILE = path.join(__dirname, '..', 'processor-production.log');

// Check interval: every hour (3600000 ms)
const CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour

let checkCount = 0;

function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  const logMessage = `${message}\n`;
  
  console.log(`[${timestamp}] ${message}`);
  
  // Append to log file
  fs.appendFileSync(LOG_FILE, `[${timestamp}] ${logMessage}`);
}

async function processScheduledSends() {
  checkCount++;
  
  try {
    log(`🔄 Checking for due sends... (check #${checkCount})`);
    
    const response = await fetch(PROCESS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Production-Auto-Processor'
      }
    });

    if (!response.ok) {
      log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      return;
    }

    const result = await response.json();
    
    if (result.processed > 0) {
      log(`✅ SUCCESS! Processed ${result.processed}/${result.total} sends`);
      
      // Log details of processed sends
      if (result.details && result.details.length > 0) {
        result.details.forEach(detail => {
          log(`   📧 ${detail.patientName} - ${detail.questionnaireName} (${detail.frequency})`);
          log(`   ⏰ Next send: ${new Date(detail.nextSend).toLocaleString()}`);
          log(`   🔗 Link: ${detail.link}`);
        });
      }
    } else {
      log(`ℹ️  No sends due for processing (${checkCount} checks total)`);
    }

  } catch (error) {
    log(`🔥 Error processing scheduled sends: ${error.message}`);
  }
}

// Initial log
log('🚀 Production Automatic Processor started');
log(`📡 Server: http://localhost:${SERVER_PORT}`);
log(`⏰ Check interval: Every hour`);
log(`📝 Log file: ${LOG_FILE}`);
log('🛑 Press Ctrl+C to stop');
log('');

// Process immediately on start
processScheduledSends();

// Set up interval
const intervalId = setInterval(processScheduledSends, CHECK_INTERVAL);

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('');
  log('🛑 Shutting down production processor...');
  clearInterval(intervalId);
  log('✅ Production processor stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('🛑 SIGTERM received, shutting down...');
  clearInterval(intervalId);
  process.exit(0);
});

// Keep the process alive
process.stdin.resume();
