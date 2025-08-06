const { Client } = require('pg');

async function migrateToUXOneDatabase() {
  console.log('🚀 Starting UXOne database migration...');
  
  // Source database (current UXOne data)
  const sourceClient = new Client({
    host: process.env.DB_HOST || '10.116.2.72',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Sud01234',
    database: 'uxonedb'
  });

  // Target database (new UXOne database)
  const targetClient = new Client({
    host: process.env.DB_HOST || '10.116.2.72',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Sud01234',
    database: 'uxone_new'
  });

  try {
    await sourceClient.connect();
    await targetClient.connect();
    console.log('✅ Connected to both databases');

    // Migrate Users
    console.log('\n📦 Migrating Users...');
    const users = await sourceClient.query('SELECT * FROM "SCHEMA"."users"');
    console.log(`Found ${users.rows.length} users to migrate`);

    for (const user of users.rows) {
      // Check if user already exists in target
      const existingUser = await targetClient.query(
        'SELECT id FROM "SCHEMA"."users" WHERE username = $1',
        [user.username]
      );

      if (existingUser.rows.length === 0) {
        await targetClient.query(`
          INSERT INTO "SCHEMA"."users" (
            id, username, name, "hashedPassword", email, image, department, 
            "departmentName", "createdAt", "updatedAt", role, "isActive", 
            "centralDepartment"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          user.id, user.username, user.name, user.hashedPassword, user.email,
          user.image, user.department, user.departmentName, user.createdAt,
          user.updatedAt, user.role, user.isActive, user.centralDepartment
        ]);
        console.log(`✅ Migrated user: ${user.username}`);
      } else {
        console.log(`⏭️  User already exists: ${user.username}`);
      }
    }

    // Migrate Notifications
    console.log('\n📦 Migrating Notifications...');
    const notifications = await sourceClient.query('SELECT * FROM "SCHEMA"."notifications"');
    console.log(`Found ${notifications.rows.length} notifications to migrate`);

    for (const notif of notifications.rows) {
      const existingNotif = await targetClient.query(
        'SELECT id FROM "SCHEMA"."notifications" WHERE id = $1',
        [notif.id]
      );

      if (existingNotif.rows.length === 0) {
        await targetClient.query(`
          INSERT INTO "SCHEMA"."notifications" (
            id, "userId", title, message, link, type, read, "createdAt", hidden
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          notif.id, notif.userId, notif.title, notif.message, notif.link,
          notif.type, notif.read, notif.createdAt, notif.hidden
        ]);
        console.log(`✅ Migrated notification: ${notif.id}`);
      }
    }

    // Migrate Projects
    console.log('\n📦 Migrating Projects...');
    const projects = await sourceClient.query('SELECT * FROM "SCHEMA"."projects"');
    console.log(`Found ${projects.rows.length} projects to migrate`);

    for (const project of projects.rows) {
      const existingProject = await targetClient.query(
        'SELECT id FROM "SCHEMA"."projects" WHERE id = $1',
        [project.id]
      );

      if (existingProject.rows.length === 0) {
        await targetClient.query(`
          INSERT INTO "SCHEMA"."projects" (
            id, name, description, "ownerId", departments, "createdAt", "updatedAt",
            status, budget, "endDate", "startDate", "documentNumber", 
            "documentTemplate", "approvalState", "departmentDueDates", "requestDate"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `, [
          project.id, project.name, project.description, project.ownerId,
          project.departments, project.createdAt, project.updatedAt, project.status,
          project.budget, project.endDate, project.startDate, project.documentNumber,
          project.documentTemplate, project.approvalState, project.departmentDueDates,
          project.requestDate
        ]);
        console.log(`✅ Migrated project: ${project.name}`);
      }
    }

    // Migrate Tasks
    console.log('\n📦 Migrating Tasks...');
    const tasks = await sourceClient.query('SELECT * FROM "SCHEMA"."tasks"');
    console.log(`Found ${tasks.rows.length} tasks to migrate`);

    for (const task of tasks.rows) {
      const existingTask = await targetClient.query(
        'SELECT id FROM "SCHEMA"."tasks" WHERE id = $1',
        [task.id]
      );

      if (existingTask.rows.length === 0) {
        await targetClient.query(`
          INSERT INTO "SCHEMA"."tasks" (
            id, title, description, "ownerId", "assigneeId", status, priority,
            "dueDate", "projectId", "createdAt", "updatedAt", "parentTaskId",
            "completedAt", "creatorId", "sourceTicketId", "startDate", "ticketIntegration"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        `, [
          task.id, task.title, task.description, task.ownerId, task.assigneeId,
          task.status, task.priority, task.dueDate, task.projectId, task.createdAt,
          task.updatedAt, task.parentTaskId, task.completedAt, task.creatorId,
          task.sourceTicketId, task.startDate, task.ticketIntegration
        ]);
        console.log(`✅ Migrated task: ${task.title}`);
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your .env.local file with:');
    console.log('   UXONE_DATABASE_URL="postgresql://postgres:Sud01234@10.116.2.72:5432/uxone_new?schema=SCHEMA"');
    console.log('2. Test the application with the new database');
    console.log('3. Verify all data has been migrated correctly');

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await sourceClient.end();
    await targetClient.end();
  }
}

migrateToUXOneDatabase(); 