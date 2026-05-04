'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getPetsByOwner, getBookingsByOwner, getTimeSlotById, getPetById } from '@/lib/db';
import { Pet, Booking, TimeSlot } from '@/lib/types';
import { PawPrint, CalendarDays, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight } from 'lucide-react';

const speciesEmoji: Record<string, string> = {
  dog: '🐶', cat: '🐱', bird: '🐦', rabbit: '🐰', other: '🐾',
};

const statusStyle: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'approved') return <CheckCircle className="w-4 h-4 inline mr-1" />;
  if (status === 'rejected') return <XCircle className="w-4 h-4 inline mr-1" />;
  return <AlertCircle className="w-4 h-4 inline mr-1" />;
};

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [bookings, setBookings] = useState<(Booking & { slot?: TimeSlot; pet?: Pet })[]>([]);

  useEffect(() => {
    if (!user) return;
    const myPets = getPetsByOwner(user.id);
    setPets(myPets);

    const myBookings = getBookingsByOwner(user.id).map((b) => ({
      ...b,
      slot: getTimeSlotById(b.slotId),
      pet: getPetById(b.petId),
    }));
    // Sort by slot date descending
    myBookings.sort((a, b) => {
      const da = a.slot?.date ?? '';
      const db = b.slot?.date ?? '';
      return da < db ? 1 : -1;
    });
    setBookings(myBookings);
  }, [user]);

  const approvedPets = pets.filter((p) => p.status === 'approved');
  const pendingPets = pets.filter((p) => p.status === 'pending');
  const upcomingBookings = bookings.filter((b) => b.slot && b.slot.date >= new Date().toISOString().slice(0, 10));

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome, {user?.name.split(' ')[0]}! 🐾
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s an overview of your pets and upcoming bookings.</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Pets', value: pets.length, icon: PawPrint, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Approved Pets', value: approvedPets.length, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Upcoming Bookings', value: upcomingBookings.length, icon: CalendarDays, color: 'text-blue-500', bg: 'bg-blue-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
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

      {/* Alerts */}
      {pendingPets.length > 0 && (
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-800">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>
            <strong>{pendingPets.length} pet{pendingPets.length > 1 ? 's are' : ' is'} awaiting approval</strong> from a daycare employee before you can book a slot.
          </span>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Pets */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">My Pets</h2>
            <Link href="/customer/pets" className="text-sm text-orange-600 hover:underline flex items-center gap-1">
              Manage <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {pets.length === 0 ? (
            <div className="card text-center text-gray-500 py-10">
              <PawPrint className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>No pets yet.</p>
              <Link href="/customer/pets" className="btn-primary mt-4 inline-block text-sm">
                Add Your First Pet
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pets.slice(0, 4).map((pet) => (
                <div key={pet.id} className="card flex items-center gap-4 py-4">
                  <span className="text-3xl">{speciesEmoji[pet.species]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{pet.name}</p>
                    <p className="text-sm text-gray-500">{pet.breed} · {pet.age}y</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusStyle[pet.status]}`}>
                    <StatusIcon status={pet.status} />{pet.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming bookings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Upcoming Bookings</h2>
            <Link href="/customer/slots" className="text-sm text-orange-600 hover:underline flex items-center gap-1">
              Book a slot <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {upcomingBookings.length === 0 ? (
            <div className="card text-center text-gray-500 py-10">
              <CalendarDays className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>No upcoming bookings.</p>
              <Link href="/customer/slots" className="btn-primary mt-4 inline-block text-sm">
                Book a Slot
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingBookings.slice(0, 4).map((b) => (
                <div key={b.id} className="card flex items-center gap-4 py-4">
                  <div className="bg-blue-50 rounded-full p-3">
                    <Clock className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{b.pet?.name}</p>
                    <p className="text-sm text-gray-500">
                      {b.slot?.date} · {b.slot?.startTime}–{b.slot?.endTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
