export type UserRole = 'customer' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

export type PetStatus = 'pending' | 'approved' | 'rejected';
export type PetSpecies = 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';

export interface Pet {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  breed: string;
  age: number;
  species: PetSpecies;
  notes?: string;
  status: PetStatus;
  rejectionReason?: string;
  createdAt: string;
}

export interface TimeSlot {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  maxPets: number;
  bookedPetIds: string[];
  createdBy: string; // employee id
  notes?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  slotId: string;
  petId: string;
  ownerId: string;
  createdAt: string;
}

export interface AppData {
  users: User[];
  pets: Pet[];
  timeSlots: TimeSlot[];
  bookings: Booking[];
}
