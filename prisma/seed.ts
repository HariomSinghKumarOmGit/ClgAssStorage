import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create initial folders
  const folders = [
    { name: "Computer Science", description: "CS assignments and resources" },
    { name: "Mathematics", description: "Math assignments" },
    { name: "Physics", description: "Physics resources" },
    { name: "Chemistry", description: "Chemistry assignments" },
    { name: "Engineering", description: "Engineering resources" },
    { name: "Economics", description: "Economics resources" },
  ];

  // ⚠️ IMPORTANT: Change this email to your actual Google account email BEFORE running seed
  const ADMIN_EMAIL = "your-admin@gmail.com";
  const ADMIN_NAME = "Admin";

  // Create admin user (they must sign in with Google first, then this updates their role)
  // If user doesn't exist yet, this creates a placeholder — they must sign in with Google
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "ADMIN", isApproved: true },
    create: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      role: "ADMIN",
      isApproved: true,
    },
  });

  console.log(`✓ Admin user: ${admin.email} (role: ${admin.role})`);

  // Create folders
  for (const folder of folders) {
    const slug =
      folder.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now().toString(36);
    await prisma.folder.upsert({
      where: { slug },
      update: {},
      create: {
        name: folder.name,
        slug,
        description: folder.description,
        createdById: admin.id,
      },
    });
  }

  console.log(`✓ Created ${folders.length} default folders`);
  console.log("\nSeed complete! ✅");
  console.log("\n⚠️  Remember to:");
  console.log("  1. Sign in with your Google account first");
  console.log("  2. Run: npm run db:seed");
  console.log("  3. Your Google account email must match ADMIN_EMAIL in prisma/seed.ts");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
