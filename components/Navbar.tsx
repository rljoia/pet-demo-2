'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PawPrint, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    router.push('/');
    setMenuOpen(false);
  }

  const customerLinks = [
    { href: '/customer', label: 'Dashboard' },
    { href: '/customer/pets', label: 'My Pets' },
    { href: '/customer/slots', label: 'Book a Slot' },
  ];

  const employeeLinks = [
    { href: '/employee', label: 'Dashboard' },
    { href: '/employee/pets', label: 'Approve Pets' },
    { href: '/employee/slots', label: 'Manage Slots' },
  ];

  const links = user?.role === 'employee' ? employeeLinks : user?.role === 'customer' ? customerLinks : [];

  return (
    <nav className="bg-white border-b border-orange-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-orange-600">
            <PawPrint className="w-6 h-6" />
            PawCare
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-gray-600 hover:text-orange-600 font-medium transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  Hi, <strong>{user.name.split(' ')[0]}</strong>
                  <span className="ml-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full capitalize">
                    {user.role}
                  </span>
                </span>
                <button onClick={handleLogout} className="flex items-center gap-1 btn-secondary text-sm py-1.5 px-3">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" className="btn-secondary text-sm py-1.5 px-4">Login</Link>
                <Link href="/signup" className="btn-primary text-sm py-1.5 px-4">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-orange-50"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="text-gray-700 hover:text-orange-600 font-medium py-2 px-2 rounded-lg hover:bg-orange-50"
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <button onClick={handleLogout} className="flex items-center gap-2 text-left text-gray-700 py-2 px-2">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link href="/login" onClick={() => setMenuOpen(false)} className="btn-secondary flex-1 text-center text-sm">Login</Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)} className="btn-primary flex-1 text-center text-sm">Sign Up</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
