'use client';

import { useEffect, useState, useCallback } from 'react';
import { getPets, updatePet } from '@/lib/db';
import { Pet } from '@/lib/types';
import { PawPrint, CheckCircle, XCircle, Clock, AlertCircle, Filter } from 'lucide-react';

const speciesEmoji: Record<string, string> = {
  dog: '🐶', cat: '🐱', bird: '🐦', rabbit: '🐰', other: '🐾',
};

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

export default function EmployeePetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [filter, setFilter] = useState<FilterType>('pending');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(() => {
    setPets(getPets());
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleApprove(id: string) {
    updatePet(id, { status: 'approved', rejectionReason: undefined });
    load();
  }

  function handleRejectStart(id: string) {
    setRejectingId(id);
    setRejectReason('');
  }

  function handleRejectConfirm() {
    if (!rejectingId) return;
    updatePet(rejectingId, { status: 'rejected', rejectionReason: rejectReason.trim() || 'Not approved by staff.' });
    setRejectingId(null);
    setRejectReason('');
    load();
  }

  function handleSetPending(id: string) {
    updatePet(id, { status: 'pending', rejectionReason: undefined });
    load();
  }

  const filtered = filter === 'all' ? pets : pets.filter((p) => p.status === filter);

  const counts = {
    all: pets.length,
    pending: pets.filter((p) => p.status === 'pending').length,
    approved: pets.filter((p) => p.status === 'approved').length,
    rejected: pets.filter((p) => p.status === 'rejected').length,
  };

  const filterTabs: { value: FilterType; label: string; count: number; color: string }[] = [
    { value: 'pending', label: 'Pending', count: counts.pending, color: 'text-yellow-600 bg-yellow-50 border-yellow-300' },
    { value: 'approved', label: 'Approved', count: counts.approved, color: 'text-green-600 bg-green-50 border-green-300' },
    { value: 'rejected', label: 'Rejected', count: counts.rejected, color: 'text-red-600 bg-red-50 border-red-300' },
    { value: 'all', label: 'All', count: counts.all, color: 'text-gray-600 bg-gray-50 border-gray-300' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Pet Approvals</h1>
        <p className="text-gray-500 mt-1">Review, approve, or reject pets submitted by customers.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Filter className="w-5 h-5 text-gray-400 self-center" />
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${
              filter === tab.value ? tab.color : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <PawPrint className="w-14 h-14 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No {filter} pets</h2>
          <p className="text-gray-400">Nothing to display here yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((pet) => (
            <div key={pet.id} className="card flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <span className="text-4xl">{speciesEmoji[pet.species]}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 text-lg">{pet.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{pet.species} · {pet.breed} · {pet.age}y</p>
                  <p className="text-sm text-gray-500">Owner: <strong>{pet.ownerName}</strong></p>
                  {pet.notes && (
                    <p className="text-xs text-gray-400 mt-1 italic bg-gray-50 rounded px-2 py-1">
                      Note: {pet.notes}
                    </p>
                  )}
                  {pet.status === 'rejected' && pet.rejectionReason && (
                    <div className="flex items-start gap-1 mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-2 py-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {pet.rejectionReason}
                    </div>
                  )}
                </div>
                {pet.status === 'pending' && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" /> Pending
                  </span>
                )}
                {pet.status === 'approved' && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center gap-1 shrink-0">
                    <CheckCircle className="w-3 h-3" /> Approved
                  </span>
                )}
                {pet.status === 'rejected' && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium flex items-center gap-1 shrink-0">
                    <XCircle className="w-3 h-3" /> Rejected
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 border-t border-gray-100 pt-3">
                {pet.status !== 'approved' && (
                  <button
                    onClick={() => handleApprove(pet.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                )}
                {pet.status !== 'rejected' && (
                  <button
                    onClick={() => handleRejectStart(pet.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 btn-danger text-sm"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                )}
                {pet.status !== 'pending' && (
                  <button
                    onClick={() => handleSetPending(pet.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 btn-secondary text-sm"
                  >
                    <Clock className="w-4 h-4" /> Set Pending
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject reason modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Reject Pet</h2>
            <p className="text-sm text-gray-500 mb-4">Optionally provide a reason for the owner.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Vaccination records missing, aggressive behavior…"
              rows={3}
              className="input-field resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectingId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleRejectConfirm} className="btn-danger flex-1">Reject Pet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
