import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { SignOutButton } from "./SignOutButton";
import { RoleBadge } from "@/components/ui/Badge";

export async function Navbar() {
  const session = await auth();
  const user = session?.user;

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

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Upload Icon Button */}
            <Link
              href="/upload"
              className="text-xs bg-brand-600 hover:bg-brand-700 text-white font-bold px-3.5 py-2 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              title="Upload File"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Upload</span>
            </Link>

            {/* Auth / Sign In */}
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
                <SignOutButton />
              </div>
            ) : (
              <Link
                href="/admin/login"
                className="text-sm text-gray-700 hover:text-gray-900 font-semibold transition-colors px-3 py-1.5 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

