'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'employee')) {
      router.replace(user ? '/customer' : '/login');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'employee') return null;
  return <>{children}</>;
}
