const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function registerPWAService() {
  try {
    // Check if PWA service already exists
    const existingService = await prisma.serviceApp.findFirst({
      where: { name: 'TIPA Mobile PWA' }
    });

    if (existingService) {
      console.log('✅ PWA service already registered:');
      console.log(`   ID: ${existingService.id}`);
      console.log(`   Name: ${existingService.name}`);
      console.log(`   Service Key: ${existingService.serviceKey}`);
      console.log(`   Permissions: ${existingService.permissions.join(', ')}`);
      return;
    }

    // Generate unique service key
    const serviceKey = crypto.randomBytes(32).toString('hex');

    // Create service app
    const serviceApp = await prisma.serviceApp.create({
      data: {
        name: 'TIPA Mobile PWA',
        serviceKey,
        permissions: [
          'approvals:read',
          'approvals:write', 
          'tasks:read',
          'tasks:write',
          'notifications:read',
          'notifications:write'
        ],
        rateLimit: 1000,
        isActive: true,
      },
    });

    console.log('✅ PWA service registered successfully!');
    console.log(`   ID: ${serviceApp.id}`);
    console.log(`   Name: ${serviceApp.name}`);
    console.log(`   Service Key: ${serviceApp.serviceKey}`);
    console.log(`   Permissions: ${serviceApp.permissions.join(', ')}`);
    console.log(`   Rate Limit: ${serviceApp.rateLimit}/minute`);
    console.log('\n📝 Save this service key securely - it will be used by the PWA to authenticate with UXOne APIs');

  } catch (error) {
    console.error('❌ Error registering PWA service:', error);
  } finally {
    await prisma.$disconnect();
  }
}

registerPWAService(); 