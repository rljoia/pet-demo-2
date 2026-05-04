'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { getTimeSlots, createTimeSlot, deleteTimeSlot, getBookings, getPetById, getUserById } from '@/lib/db';
import { TimeSlot, Booking } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarDays, Clock, Plus, Trash2, Users, X, AlertCircle, PawPrint, ChevronDown, ChevronUp } from 'lucide-react';

type SlotWithBookings = TimeSlot & {
  bookings: (Booking & { petName: string; ownerName: string })[];
};

const defaultForm = {
  date: '',
  startTime: '',
  endTime: '',
  maxPets: '5',
  notes: '',
};

export default function EmployeeSlotsPage() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<SlotWithBookings[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState('');

  const load = useCallback(() => {
    const allSlots = getTimeSlots().sort((a, b) =>
      a.date + a.startTime < b.date + b.startTime ? -1 : 1
    );
    const allBookings = getBookings();
    const enriched: SlotWithBookings[] = allSlots.map((slot) => {
      const slotBookings = allBookings
        .filter((b) => b.slotId === slot.id)
        .map((b) => {
          const pet = getPetById(b.petId);
          const owner = getUserById(b.ownerId);
          return { ...b, petName: pet?.name ?? 'Unknown', ownerName: owner?.name ?? 'Unknown' };
        });
      return { ...slot, bookings: slotBookings };
    });
    setSlots(enriched);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError('');
    const max = parseInt(form.maxPets);
    if (isNaN(max) || max < 1 || max > 50) {
      setError('Max pets must be between 1 and 50.');
      return;
    }
    if (form.startTime >= form.endTime) {
      setError('End time must be after start time.');
      return;
    }
    setLoading(true);
    try {
      createTimeSlot({
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        maxPets: max,
        createdBy: user.id,
        notes: form.notes.trim() || undefined,
      });
      load();
      setShowModal(false);
      setForm(defaultForm);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create slot');
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(id: string, booked: number) {
    if (booked > 0) {
      if (!confirm(`This slot has ${booked} booking(s). Deleting it will cancel all bookings. Continue?`)) return;
    } else {
      if (!confirm('Delete this time slot?')) return;
    }
    deleteTimeSlot(id);
    load();
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const filtered = filterDate ? slots.filter((s) => s.date === filterDate) : slots;

  // Group by date
  const grouped: Record<string, SlotWithBookings[]> = {};
  for (const slot of filtered) {
    if (!grouped[slot.date]) grouped[slot.date] = [];
    grouped[slot.date].push(slot);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Time Slots</h1>
          <p className="text-gray-500 mt-1">Create and manage daycare time slots. Set a capacity limit for each.</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setForm(defaultForm); setError(''); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Slot
        </button>
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm font-medium text-gray-700">Filter by date:</label>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="input-field w-auto"
        />
        {filterDate && (
          <button onClick={() => setFilterDate('')} className="text-sm text-orange-600 hover:underline">Clear</button>
        )}
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="card text-center py-16">
          <CalendarDays className="w-14 h-14 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No time slots found</h2>
          <p className="text-gray-400 mb-6">Create your first slot so customers can start booking!</p>
          <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Time Slot
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Object.entries(grouped).map(([date, daySlots]) => {
            const isPast = date < todayStr;
            return (
              <div key={date}>
                <h2 className={`text-lg font-bold mb-3 flex items-center gap-2 ${isPast ? 'text-gray-400' : 'text-gray-700'}`}>
                  <CalendarDays className="w-5 h-5 text-orange-400" />
                  {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  {isPast && <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Past</span>}
                </h2>
                <div className="flex flex-col gap-3">
                  {daySlots.map((slot) => {
                    const isFull = slot.bookedPetIds.length >= slot.maxPets;
                    const pct = slot.maxPets > 0 ? (slot.bookedPetIds.length / slot.maxPets) * 100 : 0;
                    const isExpanded = expandedSlot === slot.id;

                    return (
                      <div key={slot.id} className={`card ${isPast ? 'opacity-70' : ''}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Clock className="w-4 h-4 text-orange-400" />
                              <span className="font-semibold text-gray-800">
                                {slot.startTime} – {slot.endTime}
                              </span>
                              {isFull ? (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Full</span>
                              ) : (
                                <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Open</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                              <Users className="w-4 h-4" />
                              {slot.bookedPetIds.length} / {slot.maxPets} pets booked
                            </div>

                            {/* Capacity bar */}
                            <div className="w-full max-w-xs bg-gray-100 rounded-full h-2 mb-2">
                              <div
                                className={`h-2 rounded-full transition-all ${isFull ? 'bg-red-400' : pct > 75 ? 'bg-orange-400' : 'bg-green-400'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            {slot.notes && (
                              <p className="text-xs text-gray-400 italic">{slot.notes}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {slot.bookings.length > 0 && (
                              <button
                                onClick={() => setExpandedSlot(isExpanded ? null : slot.id)}
                                className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1"
                              >
                                <PawPrint className="w-4 h-4" />
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(slot.id, slot.bookings.length)}
                              className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                              title="Delete slot"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Bookings expand */}
                        {isExpanded && (
                          <div className="mt-4 border-t border-gray-100 pt-4">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Booked Pets:</p>
                            <div className="flex flex-col gap-2">
                              {slot.bookings.map((b) => (
                                <div key={b.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                                  <PawPrint className="w-4 h-4 text-orange-400" />
                                  <span className="font-medium text-gray-800">{b.petName}</span>
                                  <span className="text-gray-400">·</span>
                                  <span className="text-gray-500">Owner: {b.ownerName}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create slot modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">Create Time Slot</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 flex flex-col gap-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-lg px-3 py-2 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Date *</label>
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Max Pets *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={50}
                  value={form.maxPets}
                  onChange={(e) => setForm({ ...form, maxPets: e.target.value })}
                  className="input-field"
                />
                <p className="text-xs text-gray-400 mt-1">Maximum number of pets allowed in this slot.</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Morning play session, small dogs only…"
                  className="input-field"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
                  {loading ? 'Creating…' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
