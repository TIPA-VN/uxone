const { PrismaClient } = require('@prisma/client');

async function registerTIPAMobileService() {
  // Set the environment variable if not already set
  if (!process.env.UXONE_DATABASE_URL) {
    console.error('UXONE_DATABASE_URL environment variable is required');
    process.exit(1);
  }
  
  const prisma = new PrismaClient();

  try {
    console.log('🚀 Registering TIPA Mobile as a service app...');

    // Check if TIPA Mobile service already exists
    const existingService = await prisma.serviceApp.findFirst({
      where: { name: 'TIPA Mobile' }
    });

    if (existingService) {
      console.log('✅ TIPA Mobile service already exists');
      console.log(`Service ID: ${existingService.id}`);
      console.log(`Service Key: ${existingService.serviceKey}`);
      console.log(`Permissions: ${existingService.permissions.join(', ')}`);
      return existingService;
    }

    // Generate a service key for TIPA Mobile
    const serviceKey = 'tipa-mobile-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Create the service app
    const service = await prisma.serviceApp.create({
      data: {
        name: 'TIPA Mobile',
        serviceKey: serviceKey,
        permissions: [
          'notifications:read',
          'notifications:create',
          'notifications:update',
          'notifications:delete'
        ],
        isActive: true,
        rateLimit: 1000 // High rate limit for internal service
      }
    });

    console.log('✅ TIPA Mobile service registered successfully!');
    console.log(`Service ID: ${service.id}`);
    console.log(`Service Key: ${service.serviceKey}`);
    console.log(`Permissions: ${service.permissions.join(', ')}`);

    console.log('\n📋 Next steps:');
    console.log('1. Update TIPA Mobile to use this Bearer token:');
    console.log(`   Authorization: Bearer ${service.serviceKey}`);
    console.log('2. Update API endpoint to: http://localhost:3001/api/service/notifications');
    console.log('3. Remove the userId parameter and use recipientId instead');

    return service;

  } catch (error) {
    console.error('❌ Error registering TIPA Mobile service:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

registerTIPAMobileService();