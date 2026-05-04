'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'customer')) {
      router.replace(user ? '/employee' : '/login');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'customer') return null;
  return <>{children}</>;
}
