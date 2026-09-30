import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminEmail = process.env.MEGA_EMAIL || "admin@studyshare.com";
  const adminName = "Admin";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN", isApproved: true },
    create: {
      email: adminEmail,
      name: adminName,
      role: "ADMIN",
      isApproved: true,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: "student@studyshare.com" },
    update: { role: "USER", isApproved: true },
    create: {
      email: "student@studyshare.com",
      name: "Student Uploader",
      role: "USER",
      isApproved: true,
    },
  });

  console.log(`✓ Admin user: ${admin.email} (role: ${admin.role})`);
  console.log(`✓ Student uploader: ${student.email}`);

  // Initial folders
  const folders = [
    { name: "Computer Science", description: "CS assignments and resources" },
    { name: "Mathematics", description: "Math assignments" },
    { name: "Physics", description: "Physics resources" },
    { name: "Chemistry", description: "Chemistry assignments" },
    { name: "Electrical Engineering", description: "EE lab experiments and assignments" },
    { name: "Engineering", description: "General engineering resources" },
  ];

  for (const folder of folders) {
    const existing = await prisma.folder.findFirst({
      where: { name: folder.name },
    });

    if (!existing) {
      const slug =
        folder.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now().toString(36);
      await prisma.folder.create({
        data: {
          name: folder.name,
          slug,
          description: folder.description,
          createdById: admin.id,
        },
      });
    }
  }

  console.log(`✓ Default folders checked and created.`);
  console.log("Seed complete! ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
