"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode, useState } from "react";
import api from "@/lib/api";

interface UserProfile {
  id: number;
  email: string;
  role: string | null;
}

interface RoleProtectedRouteProps {
  children: ReactNode;
  requiredRole: string;
  fallbackMessage?: string;
}

export default function RoleProtectedRoute({
  children,
  requiredRole,
  fallbackMessage = "You don't have permission to access this page."
}: RoleProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    const checkRole = async () => {
      if (!user) return;

      try {
        const response = await api.get('/api/v1/users/me');
        const userProfile = response.data;
        setProfile(userProfile);

        // Check if user has required role
        if (userProfile.role !== requiredRole) {
          setError(fallbackMessage);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to verify permissions');
      } finally {
        setLoading(false);
      }
    };

    if (user && !authLoading) {
      checkRole();
    }
  }, [user, authLoading, router, requiredRole, fallbackMessage]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error || !profile || profile.role !== requiredRole) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-red-600">{error || fallbackMessage}</div>
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

  return <>{children}</>;
}