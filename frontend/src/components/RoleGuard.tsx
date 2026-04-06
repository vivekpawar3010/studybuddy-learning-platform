"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, ReactNode } from "react";
import api from "@/lib/api";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: ("student" | "teacher")[];
  fallback?: ReactNode;
}

export default function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return;

      try {
        const response = await api.get('/api/v1/users/me');
        const profile = response.data;
        setUserRole(profile.role);

        if (profile.role === null) {
          router.push('/select-role');
          return;
        }

        if (!allowedRoles.includes(profile.role)) {
          // User doesn't have required role
          if (fallback) {
            setLoading(false);
            return;
          }
          // Redirect to dashboard if no fallback provided
          router.push('/dashboard');
          return;
        }
      } catch (err) {
        console.error('Error checking user role:', err);
        router.push('/login');
        return;
      }

      setLoading(false);
    };

    checkUserRole();
  }, [user, router, allowedRoles, fallback]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Checking permissions...</div>
      </div>
    );
  }

  if (!userRole || !allowedRoles.includes(userRole as "student" | "teacher")) {
    return fallback || null;
  }

  return <>{children}</>;
}