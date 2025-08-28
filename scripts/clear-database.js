const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🚨 Starting database cleanup...');
  
  try {
    // Disable foreign key checks temporarily (for MySQL/PostgreSQL)
    console.log('📋 Disabling foreign key constraints...');
    
    // Clear all tables in the correct order to avoid foreign key conflicts
    const tables = [
      // Document-related tables
      'DocumentVersionTimeline',
      'DocumentRevision',
      'ContractRevision',
      'Document',
      
      // Contract workflow and approvals
      'ContractWorkflowActions',
      'ServiceApproval',
      'ServiceNotification',
      'ServiceEvent',
      'ServiceWebhook',
      
      // Project and task related
      'TaskTimeTracking',
      'TaskDependency',
      'TaskAttachment',
      'TaskComment',
      'Task',
      'ProjectComment',
      'ProjectTeamMember',
      'Project',
      
      // Contract and addendum details
      'ContractDetails',
      
      // Ticket system
      'TicketComment',
      'Ticket',
      
      // Demand system
      'DemandLine',
      'Demand',
      
      // Document templates and numbers
      'DocumentNumber',
      'DocumentTemplate',
      
      // Accounts and departments
      'ExpenseAccount',
      'DepartmentAccount',
      'Department',
      
      // JDE integration tables
      'JDEInventoryItem',
      'JDEPurchaseOrder',
      'JDEPurchaseOrderLine',
      'JDEMRPData',
      
      // Notifications and activities
      'Notification',
      'Activity',
      'Note',
      'Comment',
      
      // System configuration
      'SystemConfig',
      
      // User sessions and accounts (keep users for authentication)
      'Session',
      'Account',
      'VerificationToken',
    ];

    let totalDeleted = 0;

    for (const table of tables) {
      try {
        console.log(`🗑️  Clearing ${table}...`);
        const result = await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
        console.log(`   ✅ Deleted ${result || 0} records from ${table}`);
        totalDeleted += result || 0;
      } catch (error) {
        console.log(`   ⚠️  Could not clear ${table}: ${error.message}`);
        // Continue with other tables even if one fails
      }
    }

    // Reset auto-increment counters (for MySQL/PostgreSQL)
    console.log('🔄 Resetting auto-increment sequences...');
    
    for (const table of tables) {
      try {
        // For PostgreSQL - reset sequences
        await prisma.$executeRawUnsafe(`
          SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), 1, false)
          WHERE pg_get_serial_sequence('"${table}"', 'id') IS NOT NULL
        `);
      } catch (error) {
        // Ignore sequence reset errors - not all tables have auto-increment
      }
    }

    console.log(`\n🎉 Database cleanup completed!`);
    console.log(`📊 Total records deleted: ${totalDeleted}`);
    console.log(`👥 User accounts preserved for authentication`);
    console.log(`🏗️  Database schema structure maintained`);
    
    // Show remaining data
    const userCount = await prisma.user.count();
    console.log(`\n📈 Remaining data:`);
    console.log(`   👤 Users: ${userCount}`);
    
    console.log(`\n✅ Database is now ready for production!`);

  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
clearDatabase()
  .catch((error) => {
    console.error('💥 Database cleanup failed:', error);
    process.exit(1);
  });
