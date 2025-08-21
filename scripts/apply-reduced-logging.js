#!/usr/bin/env node

/**
 * Apply Balanced Logging Configuration
 * Run this script to reduce logging noise while keeping important transactions
 */

// Applying balanced logging configuration
// Balanced logging configuration applied:
//   - LOG_LEVEL: INFO (important transactions + warnings/errors)
//   - LOG_RETENTION_DAYS: 7 (shorter log retention)
//   - LOG_MAX_FILE_SIZE: 50MB (smaller log files)
//   - LOG_DATABASE_VERBOSE: false (reduced database noise)

// What will be logged:
//   ✅ Task and Project transactions (create, update, delete)
//   ✅ Important database operations
//   ✅ Warnings and errors
//   ❌ Routine read operations (findMany, findFirst, etc.)
//   ❌ Notification table operations (too noisy)

// Restart your application for changes to take effect
// You can also set these environment variables in your .env file
