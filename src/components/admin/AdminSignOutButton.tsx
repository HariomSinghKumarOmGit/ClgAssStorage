"use client";

import { useRouter } from "next/navigation";

export function AdminSignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors border border-gray-200 rounded-lg px-3 py-1.5"
    >
      Sign Out
    </button>
  );
}
