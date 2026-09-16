import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://yourapp.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/assignments", "/assignments/", "/folders/"],
        disallow: ["/admin", "/dashboard", "/api/", "/upload", "/login"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
