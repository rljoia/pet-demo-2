'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPetsByOwner, createPet, deletePet, updatePet } from '@/lib/db';
import { Pet, PetSpecies } from '@/lib/types';
import { PawPrint, Plus, Pencil, Trash2, X, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

const speciesEmoji: Record<string, string> = {
  dog: '🐶', cat: '🐱', bird: '🐦', rabbit: '🐰', other: '🐾',
};

const statusBadge: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending Approval',
    cls: 'bg-yellow-100 text-yellow-700',
    icon: <Clock className="w-3.5 h-3.5 inline mr-1" />,
  },
  approved: {
    label: 'Approved',
    cls: 'bg-green-100 text-green-700',
    icon: <CheckCircle className="w-3.5 h-3.5 inline mr-1" />,
  },
  rejected: {
    label: 'Rejected',
    cls: 'bg-red-100 text-red-700',
    icon: <XCircle className="w-3.5 h-3.5 inline mr-1" />,
  },
};

const defaultForm = {
  name: '',
  breed: '',
  age: '',
  species: 'dog' as PetSpecies,
  notes: '',
};

export default function CustomerPetsPage() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function loadPets() {
    if (user) setPets(getPetsByOwner(user.id));
  }

  useEffect(() => { loadPets(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError('');
    const ageNum = parseInt(form.age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 30) {
      setError('Please enter a valid age (0–30).');
      return;
    }
    setLoading(true);
    try {
      createPet({
        ownerId: user.id,
        ownerName: user.name,
        name: form.name.trim(),
        breed: form.breed.trim(),
        age: ageNum,
        species: form.species,
        notes: form.notes.trim() || undefined,
      });
      loadPets();
      setShowModal(false);
      setForm(defaultForm);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add pet');
    } finally {
      setLoading(false);
    }
  }

  function handleEditStart(pet: Pet) {
    setEditingPet(pet);
    setForm({ ...defaultForm, breed: pet.breed, age: String(pet.age), notes: pet.notes ?? '' });
    setError('');
  }

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editingPet) return;
    setError('');
    const ageNum = parseInt(form.age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 30) {
      setError('Please enter a valid age (0–30).');
      return;
    }
    setLoading(true);
    try {
      updatePet(editingPet.id, {
        breed: form.breed.trim(),
        age: ageNum,
        notes: form.notes.trim() || undefined,
      });
      loadPets();
      setEditingPet(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update pet');
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(id: string) {
    if (!confirm('Remove this pet? Any existing bookings will also be cancelled.')) return;
    deletePet(id);
    loadPets();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Pets</h1>
          <p className="text-gray-500 mt-1">Add and manage your pets. New pets need employee approval before booking.</p>
        </div>
        <button onClick={() => { setShowModal(true); setForm(defaultForm); setError(''); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Pet
        </button>
      </div>

      {pets.length === 0 ? (
        <div className="card text-center py-16">
          <PawPrint className="w-14 h-14 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No pets yet</h2>
          <p className="text-gray-400 mb-6">Add your first pet to get started!</p>
          <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add a Pet
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {pets.map((pet) => {
            const badge = statusBadge[pet.status];
            return (
              <div key={pet.id} className="card flex gap-4 relative group">
                <div className="text-4xl">{speciesEmoji[pet.species]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-gray-800 text-lg">{pet.name}</h3>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditStart(pet)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 hover:text-blue-600"
                        title="Edit pet"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pet.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600"
                        title="Remove pet"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 capitalize">{pet.species} · {pet.breed} · {pet.age} year{pet.age !== 1 ? 's' : ''} old</p>
                  {pet.notes && <p className="text-xs text-gray-400 mt-1 italic">{pet.notes}</p>}
                  {pet.status === 'rejected' && pet.rejectionReason && (
                    <div className="flex items-start gap-1 mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-2 py-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {pet.rejectionReason}
                    </div>
                  )}
                  <span className={`inline-flex items-center mt-2 text-xs font-medium px-2.5 py-1 rounded-full ${badge.cls}`}>
                    {badge.icon}{badge.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Pet Modal */}
      {editingPet && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">Edit {editingPet.name}</h2>
              <button onClick={() => setEditingPet(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 flex flex-col gap-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-lg px-3 py-2 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Breed *</label>
                  <input required value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} placeholder="Golden Retriever" className="input-field" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Age (years) *</label>
                  <input required type="number" min={0} max={30} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="3" className="input-field" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Notes (optional)</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any special needs or info for the daycare team…" rows={2} className="input-field resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingPet(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
                  {loading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Pet Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">Add a New Pet</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-lg px-3 py-2 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Pet Name *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Buddy" className="input-field" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Species *</label>
                  <select required value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value as PetSpecies })} className="input-field">
                    <option value="dog">🐶 Dog</option>
                    <option value="cat">🐱 Cat</option>
                    <option value="bird">🐦 Bird</option>
                    <option value="rabbit">🐰 Rabbit</option>
                    <option value="other">🐾 Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Breed *</label>
                  <input required value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} placeholder="Golden Retriever" className="input-field" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Age (years) *</label>
                  <input required type="number" min={0} max={30} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="3" className="input-field" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Notes (optional)</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any special needs or info for the daycare team…" rows={2} className="input-field resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
                  {loading ? 'Adding…' : 'Add Pet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
