"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

interface UserProfile {
  id: number;
  email: string;
  role: string | null;
}

function ProfileContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/api/v1/users/me');
        setProfile(response.data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">No profile data available</p>
      </div>
    );
  }

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
            href="/profile"
            className="block rounded-lg bg-blue-50 px-4 py-2 text-blue-600 font-medium"
          >
            Profile
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white shadow">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-xl font-semibold">Profile</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={() => router.push('/dashboard')}
                className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </header>

        {/* Profile Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-lg bg-white p-8 shadow">
              <h3 className="mb-6 text-2xl font-bold text-gray-800">User Profile</h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <p className="mt-1 text-lg text-gray-900">
                    {user?.displayName || 'Not provided'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <p className="mt-1 text-lg text-gray-900">{profile.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <div className="mt-1">
                    {profile.role ? (
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                        profile.role === 'student'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {profile.role === 'student' ? 'Student' : 'Teacher'}
                      </span>
                    ) : (
                      <span className="text-gray-500">Not selected yet</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    User ID
                  </label>
                  <p className="mt-1 text-sm text-gray-600">{profile.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}