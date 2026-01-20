"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

function RoleSelectionContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleSelect = async (role: string) => {
    setLoading(true);
    setError(null);

    try {
      await api.patch('/api/v1/users/role', { role });
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error setting role:', err);
      setError(err.response?.data?.detail || 'Failed to set role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to StudyBuddy! 🎓
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please select your role to continue
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => handleRoleSelect('student')}
            disabled={loading}
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-4 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Setting up...
              </div>
            ) : (
              <div className="flex items-center">
                <span className="mr-2">📚</span>
                I'm a Student
              </div>
            )}
          </button>

          <button
            onClick={() => handleRoleSelect('teacher')}
            disabled={loading}
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-green-600 py-4 px-4 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Setting up...
              </div>
            ) : (
              <div className="flex items-center">
                <span className="mr-2">👨‍🏫</span>
                I'm a Teacher
              </div>
            )}
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            You can change your role later by contacting support
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SelectRole() {
  return (
    <ProtectedRoute>
      <RoleSelectionContent />
    </ProtectedRoute>
  );
}