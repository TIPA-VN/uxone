const { Client } = require('pg');

async function setupUXOneDatabase() {
  console.log('🚀 Setting up new UXOne database...');
  
  // Connect to PostgreSQL server
  const client = new Client({
    host: process.env.DB_HOST || '10.116.2.72',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Sud01234',
    database: 'postgres' // Connect to default database first
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL server');

    // Create new database for UXOne
    const dbName = 'uxone_new';
    
    // Check if database exists
    const checkDbQuery = `
      SELECT 1 FROM pg_database WHERE datname = $1
    `;
    const dbExists = await client.query(checkDbQuery, [dbName]);
    
    if (dbExists.rows.length === 0) {
      // Create new database
      const createDbQuery = `CREATE DATABASE ${dbName}`;
      await client.query(createDbQuery);
      console.log(`✅ Created database: ${dbName}`);
    } else {
      console.log(`✅ Database ${dbName} already exists`);
    }

    // Create schema
    const schemaName = 'SCHEMA';
    const createSchemaQuery = `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`;
    await client.query(createSchemaQuery);
    console.log(`✅ Created schema: ${schemaName}`);

    console.log('\n📋 Next steps:');
    console.log('1. Update your .env.local file with:');
    console.log(`   UXONE_DATABASE_URL="postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'Sud01234'}@${process.env.DB_HOST || '10.116.2.72'}:${process.env.DB_PORT || '5432'}/uxone_new?schema=SCHEMA"`);
    console.log('2. Run: npx prisma db push');
    console.log('3. Run: npx prisma generate');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    await client.end();
  }
}

setupUXOneDatabase(); 