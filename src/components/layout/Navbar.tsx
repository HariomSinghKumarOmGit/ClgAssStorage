import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { SignOutButton } from "./SignOutButton";
import { RoleBadge } from "@/components/ui/Badge";

export async function Navbar() {
  const session = await auth();
  const user = session?.user;

  const isAdmin = user?.role === "ADMIN";
  const canModerate =
    user?.role === "MODERATOR" ||
    user?.role === "SENIOR_MODERATOR" ||
    user?.role === "ADMIN";

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg">StudyShare</span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/"
              className="text-sm font-bold text-gray-900 hover:text-brand-600 transition-colors"
            >
              HOME
            </Link>
            <Link
              href="/assignments"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Browse
            </Link>
            <Link
              href="/admin"
              className="text-sm text-brand-700 hover:text-brand-900 font-bold transition-colors"
            >
              Admin Panel
            </Link>
            <Link
              href="/upload"
              className="text-xs bg-brand-600 hover:bg-brand-700 text-white font-bold px-3.5 py-1.5 rounded-xl shadow-sm transition-colors flex items-center gap-1"
            >
              <span>➕</span> Upload (5MB)
            </Link>
          </div>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2">
                  {user.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.image}
                      alt={user.name ?? "User"}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-900 leading-tight">
                      {user.name}
                    </p>
                    <RoleBadge role={user.role} />
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  My Files
                </Link>
                <SignOutButton />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors px-3 py-1.5"
                >
                  Sign in
                </Link>
                <Link
                  href="/request-access"
                  className="text-sm bg-brand-600 text-white hover:bg-brand-700 font-medium transition-colors px-4 py-1.5 rounded-lg"
                >
                  Request Access
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
