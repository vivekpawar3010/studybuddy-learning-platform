"use client";

import { useRouter } from "next/navigation";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";

function CreateTestContent() {
  const router = useRouter();

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
            className="block rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Dashboard
          </a>
          <a
            href="/tests/create"
            className="block rounded-lg bg-blue-50 px-4 py-2 text-blue-600 font-medium"
          >
            Create Test
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white shadow">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-xl font-semibold">Create Test</h2>
            <button
              onClick={() => router.push('/dashboard')}
              className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
          </div>
        </header>

        {/* Test Creation Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-lg bg-white p-8 shadow">
              <h3 className="mb-6 text-2xl font-bold text-gray-800">Create New Test</h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Test Title
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter test title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter test description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Subject
                  </label>
                  <select className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option>Mathematics</option>
                    <option>Science</option>
                    <option>History</option>
                    <option>Literature</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                    Create Test
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CreateTest() {
  return (
    <RoleProtectedRoute
      requiredRole="teacher"
      fallbackMessage="Only teachers can create tests."
    >
      <CreateTestContent />
    </RoleProtectedRoute>
  );
}