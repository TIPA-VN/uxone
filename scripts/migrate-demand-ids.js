const { PrismaClient } = require('@prisma/client');
const { generateDemandId } = require('../lib/demand-id-generator');

const prisma = new PrismaClient();

async function migrateDemandIds() {
  try {
    // Starting demand ID migration
    
    // Get all existing demands
    const demands = await prisma.demand.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    // Found demands to migrate
    
    for (const demand of demands) {
      // Skip if already has the new format
      if (demand.id.startsWith('LR-')) {
        // Demand already has new format, skipping
        continue;
      }
      
      // Generate new ID
      const newId = await generateDemandId();
      
      // Update the demand with new ID
      await prisma.demand.update({
        where: { id: demand.id },
        data: { id: newId }
      });
      
      // Migrated demand
    }
    
    // Migration completed successfully
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