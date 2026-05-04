'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getPets, getTimeSlots, getBookings } from '@/lib/db';
import { PawPrint, CalendarDays, Clock, CheckCircle, AlertCircle, Users, ArrowRight } from 'lucide-react';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, slots: 0, bookings: 0 });
  const [pendingPets, setPendingPets] = useState<ReturnType<typeof getPets>>([]);

  useEffect(() => {
    const pets = getPets();
    const slots = getTimeSlots();
    const bookings = getBookings();
    setStats({
      total: pets.length,
      pending: pets.filter((p) => p.status === 'pending').length,
      approved: pets.filter((p) => p.status === 'approved').length,
      rejected: pets.filter((p) => p.status === 'rejected').length,
      slots: slots.length,
      bookings: bookings.length,
    });
    setPendingPets(pets.filter((p) => p.status === 'pending').slice(0, 5));
  }, []);

  const statCards = [
    { label: 'Total Pets', value: stats.total, icon: PawPrint, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Pending Approval', value: stats.pending, icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { label: 'Approved Pets', value: stats.approved, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Time Slots Created', value: stats.slots, icon: CalendarDays, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Total Bookings', value: stats.bookings, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  const speciesEmoji: Record<string, string> = {
    dog: '🐶', cat: '🐱', bird: '🐦', rabbit: '🐰', other: '🐾',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Employee Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome, {user?.name}. Manage pet approvals and time slots.</p>
      </div>

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`${bg} rounded-full p-3`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <Link href="/employee/pets" className="card hover:shadow-md transition-shadow group flex items-center gap-4">
          <div className="bg-yellow-50 rounded-full p-4">
            <PawPrint className="w-7 h-7 text-yellow-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-800">Approve Pets</h3>
            <p className="text-sm text-gray-500">{stats.pending} pets awaiting review</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
        </Link>

        <Link href="/employee/slots" className="card hover:shadow-md transition-shadow group flex items-center gap-4">
          <div className="bg-blue-50 rounded-full p-4">
            <CalendarDays className="w-7 h-7 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-800">Manage Time Slots</h3>
            <p className="text-sm text-gray-500">{stats.slots} slots created</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
        </Link>
      </div>

      {/* Pending pets list */}
      {pendingPets.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Pets Awaiting Approval</h2>
            <Link href="/employee/pets" className="text-sm text-orange-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {pendingPets.map((pet) => (
              <div key={pet.id} className="card flex items-center gap-4 py-4">
                <span className="text-3xl">{speciesEmoji[pet.species]}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{pet.name}</p>
                  <p className="text-sm text-gray-500">{pet.breed} · {pet.age}y · Owner: {pet.ownerName}</p>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
