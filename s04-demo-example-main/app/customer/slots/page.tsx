'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTimeSlots, getPetsByOwner, bookPet, cancelBooking, getBookingsByOwner, getPetById } from '@/lib/db';
import { TimeSlot, Pet, Booking } from '@/lib/types';
import { CalendarDays, Clock, Users, PawPrint, CheckCircle, AlertCircle, X } from 'lucide-react';

const speciesEmoji: Record<string, string> = {
  dog: '🐶', cat: '🐱', bird: '🐦', rabbit: '🐰', other: '🐾',
};

type SlotWithBooking = TimeSlot & { myBooking?: Booking & { pet?: Pet } };

export default function CustomerSlotsPage() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<SlotWithBooking[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotWithBooking | null>(null);
  const [selectedPet, setSelectedPet] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState('');

  const load = useCallback(() => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const myBookings = getBookingsByOwner(user.id);
    const myPets = getPetsByOwner(user.id);
    const approvedPets = myPets.filter((p) => p.status === 'approved');
    setPets(approvedPets);
    setBookings(myBookings);

    const allSlots = getTimeSlots()
      .filter((s) => s.date >= today)
      .sort((a, b) => (a.date + a.startTime < b.date + b.startTime ? -1 : 1));

    const enriched: SlotWithBooking[] = allSlots.map((slot) => {
      const myBooking = myBookings.find((b) => b.slotId === slot.id);
      return {
        ...slot,
        myBooking: myBooking
          ? { ...myBooking, pet: getPetById(myBooking.petId) }
          : undefined,
      };
    });
    setSlots(enriched);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function handleBook() {
    if (!user || !selectedSlot || !selectedPet) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      bookPet(selectedSlot.id, selectedPet, user.id);
      setSuccess(`Booking confirmed for slot on ${selectedSlot.date}!`);
      setSelectedSlot(null);
      setSelectedPet('');
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(bookingId: string) {
    if (!user) return;
    if (!confirm('Cancel this booking?')) return;
    try {
      cancelBooking(bookingId, user.id);
      load();
      setSuccess('Booking cancelled.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to cancel');
    }
  }

  const filtered = filterDate ? slots.filter((s) => s.date === filterDate) : slots;

  // Group by date
  const grouped: Record<string, SlotWithBooking[]> = {};
  for (const slot of filtered) {
    if (!grouped[slot.date]) grouped[slot.date] = [];
    grouped[slot.date].push(slot);
  }

  const hasPets = pets.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Book a Time Slot</h1>
        <p className="text-gray-500 mt-1">
          Choose an available slot and select which approved pet to bring.
        </p>
      </div>

      {/* Alerts */}
      {!hasPets && (
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-800">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>You need at least one <strong>approved</strong> pet to book a slot. Add a pet and wait for employee approval.</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-sm text-green-800">
          <CheckCircle className="w-5 h-5 shrink-0" />
          {success}
          <button onClick={() => setSuccess('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm font-medium text-gray-700">Filter by date:</label>
        <input
          type="date"
          value={filterDate}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setFilterDate(e.target.value)}
          className="input-field w-auto"
        />
        {filterDate && (
          <button onClick={() => setFilterDate('')} className="text-sm text-orange-600 hover:underline">
            Clear
          </button>
        )}
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="card text-center py-16">
          <CalendarDays className="w-14 h-14 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No upcoming slots</h2>
          <p className="text-gray-400">Check back later — employees will add new time slots soon.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Object.entries(grouped).map(([date, daySlots]) => (
            <div key={date}>
              <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-orange-400" />
                {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {daySlots.map((slot) => {
                  const isFull = slot.bookedPetIds.length >= slot.maxPets;
                  const isBooked = !!slot.myBooking;
                  return (
                    <div
                      key={slot.id}
                      className={`card flex flex-col gap-3 ${isFull && !isBooked ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-700 font-semibold">
                          <Clock className="w-4 h-4 text-orange-400" />
                          {slot.startTime} – {slot.endTime}
                        </div>
                        {isBooked ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Booked
                          </span>
                        ) : isFull ? (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">Full</span>
                        ) : (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-medium">Available</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        {slot.bookedPetIds.length} / {slot.maxPets} pets booked
                      </div>

                      {/* Capacity bar */}
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${isFull ? 'bg-red-400' : 'bg-orange-400'}`}
                          style={{ width: `${(slot.bookedPetIds.length / slot.maxPets) * 100}%` }}
                        />
                      </div>

                      {slot.notes && <p className="text-xs text-gray-400 italic">{slot.notes}</p>}

                      {isBooked ? (
                        <div className="flex items-center justify-between bg-green-50 rounded-xl px-3 py-2">
                          <span className="text-sm font-medium text-green-800">
                            {speciesEmoji[slot.myBooking!.pet?.species ?? 'other']} {slot.myBooking!.pet?.name}
                          </span>
                          <button
                            onClick={() => handleCancel(slot.myBooking!.id)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : !isFull && hasPets ? (
                        <button
                          onClick={() => { setSelectedSlot(slot); setSelectedPet(''); setError(''); }}
                          className="btn-primary text-sm w-full flex items-center justify-center gap-2"
                        >
                          <PawPrint className="w-4 h-4" /> Book this Slot
                        </button>
                      ) : !hasPets ? (
                        <p className="text-xs text-gray-400 text-center">Add an approved pet to book</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">Select a Pet</h2>
              <button onClick={() => setSelectedSlot(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Booking: <strong>{selectedSlot.date}</strong> · {selectedSlot.startTime}–{selectedSlot.endTime}
              </p>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-lg px-3 py-2 text-sm mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <div className="flex flex-col gap-2 mb-6">
                {pets.map((pet) => (
                  <button
                    key={pet.id}
                    onClick={() => setSelectedPet(pet.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                      selectedPet === pet.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <span className="text-2xl">{speciesEmoji[pet.species]}</span>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">{pet.name}</p>
                      <p className="text-xs text-gray-500">{pet.breed} · {pet.age}y</p>
                    </div>
                    {selectedPet === pet.id && <CheckCircle className="w-5 h-5 text-orange-500 ml-auto" />}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setSelectedSlot(null)} className="btn-secondary flex-1">Cancel</button>
                <button
                  onClick={handleBook}
                  disabled={!selectedPet || loading}
                  className="btn-primary flex-1 disabled:opacity-60"
                >
                  {loading ? 'Booking…' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
