const { PrismaClient } = require('@prisma/client');
const { generateDemandId } = require('../lib/demand-id-generator');

const prisma = new PrismaClient();

async function migrateDemandIds() {
  try {
    console.log('Starting demand ID migration...');
    
    // Get all existing demands
    const demands = await prisma.demand.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`Found ${demands.length} demands to migrate`);
    
    for (const demand of demands) {
      // Skip if already has the new format
      if (demand.id.startsWith('LR-')) {
        console.log(`Demand ${demand.id} already has new format, skipping`);
        continue;
      }
      
      // Generate new ID
      const newId = await generateDemandId();
      
      // Update the demand with new ID
      await prisma.demand.update({
        where: { id: demand.id },
        data: { id: newId }
      });
      
      console.log(`Migrated demand ${demand.id} to ${newId}`);
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateDemandIds();
}

module.exports = { migrateDemandIds }; 