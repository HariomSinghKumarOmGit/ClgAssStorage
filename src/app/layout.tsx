import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { SessionProvider } from "next-auth/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "StudyShare — Academic Assignment Library",
    template: "%s | StudyShare",
  },
  description:
    "Find and share academic assignments, notes, and resources. Browse by subject, semester, and course.",
  openGraph: {
    siteName: "StudyShare",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 text-gray-900 antialiased`}>
        <SessionProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          <footer className="border-t border-gray-200 bg-white mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-500">
                  © {new Date().getFullYear()} StudyShare. Share knowledge responsibly.
                </p>
                <div className="flex gap-6 text-sm text-gray-500">
                  <a href="/assignments" className="hover:text-gray-900 transition-colors">Browse</a>
                  <a href="/upload" className="hover:text-gray-900 transition-colors">Upload</a>
                  <a href="/request-access" className="hover:text-gray-900 transition-colors">Request Access</a>
                </div>
              </div>
            </div>
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
