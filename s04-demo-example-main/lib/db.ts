import { AppData, User, Pet, TimeSlot, Booking } from './types';

const DB_KEY = 'petdaycare_db';

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getDB(): AppData {
  if (typeof window === 'undefined') {
    return { users: [], pets: [], timeSlots: [], bookings: [] };
  }
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const initial: AppData = { users: [], pets: [], timeSlots: [], bookings: [] };
    localStorage.setItem(DB_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(raw) as AppData;
}

function saveDB(data: AppData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DB_KEY, JSON.stringify(data));
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Users ─────────────────────────────────────────────────────────────────────

export function getUsers(): User[] {
  return getDB().users;
}

export function getUserById(id: string): User | undefined {
  return getDB().users.find((u) => u.id === id);
}

export function getUserByEmail(email: string): User | undefined {
  return getDB().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function createUser(
  name: string,
  email: string,
  password: string,
  role: 'customer' | 'employee'
): Promise<User> {
  const db = getDB();
  if (db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('A user with this email already exists.');
  }
  const user: User = {
    id: generateId(),
    name,
    email,
    passwordHash: await hashPassword(password),
    role,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  saveDB(db);
  return user;
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  const hash = await hashPassword(password);
  return hash === user.passwordHash;
}

// ── Pets ──────────────────────────────────────────────────────────────────────

export function getPets(): Pet[] {
  return getDB().pets;
}

export function getPetsByOwner(ownerId: string): Pet[] {
  return getDB().pets.filter((p) => p.ownerId === ownerId);
}

export function getPetById(id: string): Pet | undefined {
  return getDB().pets.find((p) => p.id === id);
}

export function createPet(petData: Omit<Pet, 'id' | 'createdAt' | 'status'>): Pet {
  const db = getDB();
  const pet: Pet = {
    ...petData,
    id: generateId(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  db.pets.push(pet);
  saveDB(db);
  return pet;
}

export function updatePet(id: string, updates: Partial<Pet>): void {
  const db = getDB();
  const idx = db.pets.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Pet not found');
  db.pets[idx] = { ...db.pets[idx], ...updates };
  saveDB(db);
}

export function deletePet(id: string): void {
  const db = getDB();
  db.pets = db.pets.filter((p) => p.id !== id);
  // Also remove related bookings
  db.bookings = db.bookings.filter((b) => b.petId !== id);
  // Remove from time slots
  db.timeSlots = db.timeSlots.map((s) => ({
    ...s,
    bookedPetIds: s.bookedPetIds.filter((pid) => pid !== id),
  }));
  saveDB(db);
}

// ── Time Slots ────────────────────────────────────────────────────────────────

export function getTimeSlots(): TimeSlot[] {
  return getDB().timeSlots;
}

export function getTimeSlotById(id: string): TimeSlot | undefined {
  return getDB().timeSlots.find((s) => s.id === id);
}

export function createTimeSlot(
  slotData: Omit<TimeSlot, 'id' | 'createdAt' | 'bookedPetIds'>
): TimeSlot {
  const db = getDB();
  const slot: TimeSlot = {
    ...slotData,
    id: generateId(),
    bookedPetIds: [],
    createdAt: new Date().toISOString(),
  };
  db.timeSlots.push(slot);
  saveDB(db);
  return slot;
}

export function updateTimeSlot(id: string, updates: Partial<TimeSlot>): void {
  const db = getDB();
  const idx = db.timeSlots.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error('Time slot not found');
  db.timeSlots[idx] = { ...db.timeSlots[idx], ...updates };
  saveDB(db);
}

export function deleteTimeSlot(id: string): void {
  const db = getDB();
  db.timeSlots = db.timeSlots.filter((s) => s.id !== id);
  db.bookings = db.bookings.filter((b) => b.slotId !== id);
  saveDB(db);
}

// ── Bookings ──────────────────────────────────────────────────────────────────

export function getBookings(): Booking[] {
  return getDB().bookings;
}

export function getBookingsByOwner(ownerId: string): Booking[] {
  return getDB().bookings.filter((b) => b.ownerId === ownerId);
}

export function bookPet(slotId: string, petId: string, ownerId: string): Booking {
  const db = getDB();
  const slot = db.timeSlots.find((s) => s.id === slotId);
  if (!slot) throw new Error('Time slot not found.');
  if (slot.bookedPetIds.length >= slot.maxPets) throw new Error('This time slot is full.');
  if (slot.bookedPetIds.includes(petId)) throw new Error('This pet is already booked for this slot.');
  // Check if owner already has a pet in this slot
  const ownerPetIds = db.pets.filter((p) => p.ownerId === ownerId).map((p) => p.id);
  const alreadyBooked = slot.bookedPetIds.some((pid) => ownerPetIds.includes(pid));
  if (alreadyBooked) throw new Error('You already have a pet booked for this time slot.');

  slot.bookedPetIds.push(petId);
  const booking: Booking = {
    id: generateId(),
    slotId,
    petId,
    ownerId,
    createdAt: new Date().toISOString(),
  };
  db.bookings.push(booking);
  saveDB(db);
  return booking;
}

export function cancelBooking(bookingId: string, ownerId: string): void {
  const db = getDB();
  const booking = db.bookings.find((b) => b.id === bookingId);
  if (!booking) throw new Error('Booking not found.');
  if (booking.ownerId !== ownerId) throw new Error('Unauthorized.');
  const slot = db.timeSlots.find((s) => s.id === booking.slotId);
  if (slot) {
    slot.bookedPetIds = slot.bookedPetIds.filter((pid) => pid !== booking.petId);
  }
  db.bookings = db.bookings.filter((b) => b.id !== bookingId);
  saveDB(db);
}

// ── Seed Data ─────────────────────────────────────────────────────────────────

export async function seedIfEmpty(): Promise<void> {
  const db = getDB();
  if (db.users.length > 0) return;

  const employeeHash = await hashPassword('employee123');
  const customerHash = await hashPassword('customer123');

  const employee: User = {
    id: generateId(),
    name: 'Alex Employee',
    email: 'employee@petdaycare.com',
    passwordHash: employeeHash,
    role: 'employee',
    createdAt: new Date().toISOString(),
  };
  const customer: User = {
    id: generateId(),
    name: 'Jamie Customer',
    email: 'customer@petdaycare.com',
    passwordHash: customerHash,
    role: 'customer',
    createdAt: new Date().toISOString(),
  };
  db.users.push(employee, customer);

  // Seed a couple of time slots for the next 3 days
  const today = new Date();
  for (let i = 1; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    db.timeSlots.push({
      id: generateId(),
      date: dateStr,
      startTime: '09:00',
      endTime: '12:00',
      maxPets: 5,
      bookedPetIds: [],
      createdBy: employee.id,
      notes: 'Morning session',
      createdAt: new Date().toISOString(),
    });
    db.timeSlots.push({
      id: generateId(),
      date: dateStr,
      startTime: '13:00',
      endTime: '17:00',
      maxPets: 4,
      bookedPetIds: [],
      createdBy: employee.id,
      notes: 'Afternoon session',
      createdAt: new Date().toISOString(),
    });
  }

  saveDB(db);
}
