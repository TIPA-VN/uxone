import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  try {
    // Create users (department heads)
    const usersResult = await prisma.user.createMany({
      data: [
        { username: "logistics_head", email: "logistics@demo.com", role: "MANAGER", department: "LOG", name: "Logistics Head", hashedPassword: "demopass1" },
        { username: "qa_head", email: "qa@demo.com", role: "MANAGER", department: "QA", name: "QA Head", hashedPassword: "demopass1" },
        { username: "pc_head", email: "pc@demo.com", role: "MANAGER", department: "PC", name: "PC Head", hashedPassword: "demopass1" },
        { username: "admin", email: "admin@demo.com", role: "ADMIN", department: "ADMIN", name: "Admin User", hashedPassword: "demopass1" },
        // IS Team Members
        { username: "is_manager", email: "is_manager@demo.com", role: "SENIOR_MANAGER", department: "IS", name: "IS Manager", hashedPassword: "demopass1" },
        { username: "is_developer", email: "is_developer@demo.com", role: "DEVELOPER", department: "IS", name: "IS Developer", hashedPassword: "demopass1" },
        { username: "is_support", email: "is_support@demo.com", role: "SUPPORT", department: "IS", name: "IS Support", hashedPassword: "demopass1" },
        // LVM-ME Team Members
        { username: "me_engineer", email: "me_engineer@demo.com", role: "ENGINEER", department: "LVM-ME", name: "ME Engineer", hashedPassword: "demopass1" },
        { username: "me_technician", email: "me_technician@demo.com", role: "TECHNICIAN", department: "LVM-ME", name: "ME Technician", hashedPassword: "demopass1" },
      ],
      skipDuplicates: true,
    });
  

    const admin = await prisma.user.findUnique({ where: { username: "admin" } });
    if (!admin) {
      throw new Error("Admin user not found after creation. Seeding aborted.");
    }

    // Find LVM-ME users
    const meEngineer = await prisma.user.findUnique({ where: { username: "me_engineer" } });
    const meTechnician = await prisma.user.findUnique({ where: { username: "me_technician" } });
  

    // Create a project with multiple departments for approval
    const project = await prisma.project.create({
      data: {
        name: "Demo Project",
        description: "A sample project for workflow demo.",
        ownerId: admin.id,
        departments: ["LOG", "QA", "PC"],
        approvalState: { LOG: "PENDING", QA: "PENDING", PC: "PENDING" },
        status: "ACTIVE",
      },
    });

    // Create LVM-ME specific projects
    const meProject1 = await prisma.project.create({
      data: {
        name: "Process Optimization A-15",
        description: "Optimize manufacturing process for product line A-15 to improve efficiency by 20%",
        ownerId: meEngineer?.id || admin.id,
        departments: ["LVM-ME"],
        approvalState: { "LVM-ME": "APPROVED" },
        status: "IN_PROGRESS",
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-06-30"),
        budget: 50000,
      },
    });

    const meProject2 = await prisma.project.create({
      data: {
        name: "Equipment Design B-22",
        description: "Design new manufacturing equipment for product line B-22",
        ownerId: meEngineer?.id || admin.id,
        departments: ["LVM-ME"],
        approvalState: { "LVM-ME": "APPROVED" },
        status: "ACTIVE",
        startDate: new Date("2024-02-01"),
        endDate: new Date("2024-08-31"),
        budget: 75000,
      },
    });

    const meProject3 = await prisma.project.create({
      data: {
        name: "Quality System C-08",
        description: "Implement new quality control system for manufacturing line C-08",
        ownerId: meEngineer?.id || admin.id,
        departments: ["LVM-ME"],
        approvalState: { "LVM-ME": "PENDING" },
        status: "PENDING",
        startDate: new Date("2024-03-01"),
        endDate: new Date("2024-09-30"),
        budget: 30000,
      },
    });

    // Create tasks for LVM-ME projects
    if (meProject1) {
      await prisma.task.create({
        data: {
          title: "Process Analysis",
          description: "Analyze current manufacturing process and identify bottlenecks",
          status: "IN_PROGRESS",
          priority: "HIGH",
          dueDate: new Date("2024-04-15"),
          projectId: meProject1.id,
          assigneeId: meEngineer?.id,
          creatorId: meEngineer?.id || admin.id,
        },
      });

      await prisma.task.create({
        data: {
          title: "Equipment Calibration",
          description: "Calibrate manufacturing equipment for optimal performance",
          status: "PENDING",
          priority: "MEDIUM",
          dueDate: new Date("2024-04-30"),
          projectId: meProject1.id,
          assigneeId: meTechnician?.id,
          creatorId: meEngineer?.id || admin.id,
        },
      });
    }

    if (meProject2) {
      await prisma.task.create({
        data: {
          title: "Design Specifications",
          description: "Create detailed design specifications for new equipment",
          status: "IN_PROGRESS",
          priority: "HIGH",
          dueDate: new Date("2024-05-15"),
          projectId: meProject2.id,
          assigneeId: meEngineer?.id,
          creatorId: meEngineer?.id || admin.id,
        },
      });

      await prisma.task.create({
        data: {
          title: "Prototype Testing",
          description: "Test prototype equipment and document results",
          status: "PENDING",
          priority: "MEDIUM",
          dueDate: new Date("2024-06-15"),
          projectId: meProject2.id,
          assigneeId: meTechnician?.id,
          creatorId: meEngineer?.id || admin.id,
        },
      });
    }

    if (meProject3) {
      await prisma.task.create({
        data: {
          title: "System Requirements",
          description: "Define requirements for new quality control system",
          status: "PENDING",
          priority: "LOW",
          dueDate: new Date("2024-05-01"),
          projectId: meProject3.id,
          assigneeId: meEngineer?.id,
          creatorId: meEngineer?.id || admin.id,
        },
      });
    }
  

    // Create a document for the project and logistics department
    const document = await prisma.document.create({
      data: {
        fileName: "specs.pdf",
        filePath: "/uploads/specs.pdf",
        fileType: "pdf",
        size: 123456,
        version: 1,
        metadata: { type: "spec", project: "Demo Project", part: "A1" },
        ownerId: admin.id,
        department: "LOG",
        accessRoles: ["ADMIN", "MANAGER"],
        projectId: project.id,
      },
    });

    console.log("✅ Seeding completed successfully!");
    console.log(`📊 Created ${meProject1 ? 1 : 0} + ${meProject2 ? 1 : 0} + ${meProject3 ? 1 : 0} LVM-ME projects`);
    console.log(`📝 Created multiple tasks for LVM-ME projects`);
  
  } catch (e) {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 