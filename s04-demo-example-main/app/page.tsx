'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PawPrint, Clock, Shield, Heart, Star, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: Clock,
    title: 'Flexible Time Slots',
    desc: 'Choose from morning and afternoon sessions that fit your schedule.',
  },
  {
    icon: Shield,
    title: 'Vetted & Approved',
    desc: 'Every pet goes through an approval process to ensure a safe environment.',
  },
  {
    icon: Heart,
    title: 'Multiple Pets',
    desc: 'Add all your furry family members and manage their bookings in one place.',
  },
  {
    icon: Star,
    title: 'Professional Staff',
    desc: 'Our experienced team gives each pet the attention and care they deserve.',
  },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-400 to-amber-300 text-white">
        <div className="relative max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 backdrop-blur rounded-full p-4">
              <PawPrint className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-5xl font-extrabold mb-4 drop-shadow">
            Welcome to PawCare Daycare
          </h1>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            A loving, professional daycare for your furry companions. Book time slots, manage multiple pets, and enjoy peace of mind.
          </p>
          {user ? (
            <Link
              href={user.role === 'employee' ? '/employee' : '/customer'}
              className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              Go to Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 border-2 border-white text-white font-bold py-3 px-8 rounded-full hover:bg-white/10 transition-all"
              >
                Log In
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Demo credentials banner */}
      {!user && (
        <section className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-4xl mx-auto px-6 py-4 text-center text-sm text-amber-800">
            <strong>Demo Accounts:</strong> Employee — <code>employee@petdaycare.com</code> / <code>employee123</code> &nbsp;|&nbsp;
            Customer — <code>customer@petdaycare.com</code> / <code>customer123</code>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Why PawCare?</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card flex flex-col items-center text-center gap-4 hover:shadow-md transition-shadow">
              <div className="bg-orange-100 rounded-full p-4">
                <Icon className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="font-bold text-gray-800">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="bg-orange-500 text-white">
          <div className="max-w-3xl mx-auto px-6 py-16 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to join PawCare?</h2>
            <p className="text-white/80 mb-8">Create a free account today and book your pet&apos;s first session.</p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold py-3 px-8 rounded-full hover:scale-105 transition-all shadow-lg"
            >
              Sign Up Free <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
