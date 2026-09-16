import { db } from "@/lib/db";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://yourapp.vercel.app";

  const assignments = await db.assignment.findMany({
    where: { status: "APPROVED" },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const folders = await db.folder.findMany({
    select: { slug: true, updatedAt: true },
  });

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/assignments`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    ...assignments.map((a) => ({
      url: `${baseUrl}/assignments/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...folders.map((f) => ({
      url: `${baseUrl}/folders/${f.slug}`,
      lastModified: f.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
  ];
}
