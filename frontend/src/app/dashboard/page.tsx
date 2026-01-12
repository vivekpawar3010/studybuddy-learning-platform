"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import ProtectedRoute from "@/components/ProtectedRoute";

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600">StudyBuddy</h1>
        </div>
        <nav className="space-y-2 p-6">
          <a
            href="/dashboard"
            className="block rounded-lg bg-blue-50 px-4 py-2 text-blue-600 font-medium"
          >
            Dashboard
          </a>
          <a
            href="/courses"
            className="block rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Courses
          </a>
          <a
            href="/progress"
            className="block rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Progress
          </a>
          <a
            href="/settings"
            className="block rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Settings
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white shadow">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-xl font-semibold">Welcome back, {user?.email?.split("@")[0]}</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-800">Courses Enrolled</h3>
              <p className="mt-2 text-3xl font-bold text-blue-600">0</p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-800">Learning Streak</h3>
              <p className="mt-2 text-3xl font-bold text-green-600">0 days</p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-800">Total Points</h3>
              <p className="mt-2 text-3xl font-bold text-purple-600">0 pts</p>
            </div>
          </div>

          <div className="mt-8 rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-800">Quick Start</h3>
            <p className="mt-2 text-gray-600">
              Welcome to StudyBuddy 🎓! Start exploring courses and track your learning progress.
            </p>
            <button className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Browse Courses
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
