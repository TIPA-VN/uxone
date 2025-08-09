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
      ],
      skipDuplicates: true,
    });
  

    const admin = await prisma.user.findUnique({ where: { username: "admin" } });
    if (!admin) {
      throw new Error("Admin user not found after creation. Seeding aborted.");
    }
  

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
  

  
  } catch (e) {
    console.error("Seeding failed:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 