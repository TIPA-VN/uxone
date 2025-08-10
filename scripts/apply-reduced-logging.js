#!/usr/bin/env node

/**
 * Apply Balanced Logging Configuration
 * Run this script to reduce logging noise while keeping important transactions
 */

console.log('🔇 Applying balanced logging configuration...');

// Set environment variables for balanced logging
process.env.LOG_LEVEL = 'INFO';
process.env.LOG_RETENTION_DAYS = '7';
process.env.LOG_MAX_FILE_SIZE = '50MB';
process.env.LOG_DATABASE_VERBOSE = 'false';

console.log('✅ Balanced logging configuration applied:');
console.log('   - LOG_LEVEL: INFO (important transactions + warnings/errors)');
console.log('   - LOG_RETENTION_DAYS: 7 (shorter log retention)');
console.log('   - LOG_MAX_FILE_SIZE: 50MB (smaller log files)');
console.log('   - LOG_DATABASE_VERBOSE: false (reduced database noise)');

console.log('\n📝 What will be logged:');
console.log('   ✅ Task and Project transactions (create, update, delete)');
console.log('   ✅ Important database operations');
console.log('   ✅ Warnings and errors');
console.log('   ❌ Routine read operations (findMany, findFirst, etc.)');
console.log('   ❌ Notification table operations (too noisy)');

console.log('\n📝 Restart your application for changes to take effect');
console.log('💡 You can also set these environment variables in your .env file');
