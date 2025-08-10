/**
 * Reduced Verbosity Logging Configuration
 * Import this file to override default logging with minimal output
 */

export const REDUCED_VERBOSITY_CONFIG = {
  // Log info level for important transactions, but reduce noise
  level: 'INFO' as const,
  
  // Shorter retention
  retentionDays: 7,
  
  // Smaller file sizes
  maxFileSize: '50MB',
  
  // Keep database logging for important operations
  databaseVerbose: false,
  
  // Log significant operations including updates
  significantOperations: ['create', 'update', 'delete', 'executeRaw'],
  
  // Only exclude truly noisy tables
  excludedTables: ['Notification'],
  
  // Exclude routine read operations but keep write operations
  excludedOperations: ['findMany', 'findFirst', 'findUnique', 'count', 'aggregate']
};

export const applyReducedVerbosity = () => {
  // Override environment variables
  if (!process.env.LOG_LEVEL) {
    process.env.LOG_LEVEL = 'WARN';
  }
  
  if (!process.env.LOG_RETENTION_DAYS) {
    process.env.LOG_RETENTION_DAYS = '7';
  }
  
  if (!process.env.LOG_MAX_FILE_SIZE) {
    process.env.LOG_MAX_FILE_SIZE = '50MB';
  }
  
  console.log('🔇 Reduced verbosity logging enabled');
  console.log('📝 Only WARN and ERROR level logs will be shown');
  console.log('🗄️ Database operations logging minimized');
};
