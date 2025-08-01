import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const departmentAccounts = [
  // LVM Business Unit
  { bu: 'LVM', department: 'Manufacturing Engineering', account: 1110, approvalRoute: 'MANAGER' },
  { bu: 'LVM', department: 'Procurement', account: 1120, approvalRoute: 'DIRECTOR' },
  { bu: 'LVM', department: 'Quality Assurance', account: 1130, approvalRoute: 'MANAGER' },
  { bu: 'LVM', department: 'Production Maintenance', account: 1140, approvalRoute: 'MANAGER' },
  { bu: 'LVM', department: 'Product Engineering', account: 1150, approvalRoute: 'DIRECTOR' },
  { bu: 'LVM', department: 'Production Control', account: 1160, approvalRoute: 'MANAGER' },
  { bu: 'LVM', department: 'RoterStator Assembly', account: 1170, approvalRoute: 'MANAGER' },
  { bu: 'LVM', department: 'Winding', account: 1180, approvalRoute: 'MANAGER' },
  { bu: 'LVM', department: 'Lamination Punching', account: 1190, approvalRoute: 'MANAGER' },
  { bu: 'LVM', department: 'Motor Painting', account: 1200, approvalRoute: 'MANAGER' },
  { bu: 'LVM', department: 'Bracket Machining', account: 1210, approvalRoute: 'MANAGER' },
  { bu: 'LVM', department: 'Frame Machining', account: 1220, approvalRoute: 'MANAGER' },
  { bu: 'LVM', department: 'Rotor Die Casting', account: 1230, approvalRoute: 'MANAGER' },
  { bu: 'LVM', department: 'Vanish', account: 1240, approvalRoute: 'MANAGER' },
  { bu: 'LVM', department: 'Shaft Machining', account: 1250, approvalRoute: 'MANAGER' },
  { bu: 'LVM', department: 'Motor Assembly', account: 1260, approvalRoute: 'MANAGER' },
  { bu: 'LVM', department: 'Packing', account: 1270, approvalRoute: 'MANAGER' },
  { bu: 'LVM', department: 'HRA', account: 1310, approvalRoute: 'DIRECTOR' },
  { bu: 'LVM', department: 'ACC', account: 1320, approvalRoute: 'DIRECTOR' },
  { bu: 'LVM', department: 'IS', account: 1330, approvalRoute: 'DIRECTOR' },
  { bu: 'LVM', department: 'CS', account: 1340, approvalRoute: 'DIRECTOR' },
  { bu: 'LVM', department: 'Logistic', account: 1350, approvalRoute: 'MANAGER' },

  // TRD Business Unit
  { bu: 'TRD', department: 'HRA', account: 5110, approvalRoute: 'DIRECTOR' },
  { bu: 'TRD', department: 'ACC', account: 5120, approvalRoute: 'DIRECTOR' },
  { bu: 'TRD', department: 'IS', account: 5130, approvalRoute: 'DIRECTOR' },
  { bu: 'TRD', department: 'CS', account: 5140, approvalRoute: 'DIRECTOR' },
  { bu: 'TRD', department: 'Logistic', account: 5150, approvalRoute: 'MANAGER' },
  { bu: 'TRD', department: 'Manufacturing Engineering', account: 5210, approvalRoute: 'MANAGER' },
  { bu: 'TRD', department: 'Production Maintenance', account: 5220, approvalRoute: 'MANAGER' },
  { bu: 'TRD', department: 'Quality Assurance', account: 5230, approvalRoute: 'MANAGER' },
  { bu: 'TRD', department: 'Product Engineering', account: 5240, approvalRoute: 'DIRECTOR' },
  { bu: 'TRD', department: 'Production Control', account: 5250, approvalRoute: 'MANAGER' },
  { bu: 'TRD', department: 'RoterStator Assembly', account: 5260, approvalRoute: 'MANAGER' },
  { bu: 'TRD', department: 'Winding', account: 5270, approvalRoute: 'MANAGER' },
  { bu: 'TRD', department: 'Lamination Punching', account: 5280, approvalRoute: 'MANAGER' },
  { bu: 'TRD', department: 'Motor Painting', account: 5290, approvalRoute: 'MANAGER' },
  { bu: 'TRD', department: 'Bracket Machining', account: 5300, approvalRoute: 'MANAGER' },
  { bu: 'TRD', department: 'Frame Machining', account: 5310, approvalRoute: 'MANAGER' },
  { bu: 'TRD', department: 'Rotor Die Casting', account: 5320, approvalRoute: 'MANAGER' },
];

async function main() {
  console.log('🌱 Seeding department accounts...');

  // Clear existing data
  await prisma.departmentAccount.deleteMany();

  // Insert new data
  for (const deptAccount of departmentAccounts) {
    await prisma.departmentAccount.create({
      data: deptAccount,
    });
  }

  console.log(`✅ Seeded ${departmentAccounts.length} department accounts`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding department accounts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 