// src/store/reservationStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export interface Reservation {
    _id: string;
    garageId: string;
    garageName: string;
    vehicleId: string;
    vehicleName: string;
    startTime: string;
    endTime: string;
    status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
    totalPrice: number;
    notes?: string;
    createdAt: string;
}

interface ReservationState {
    reservations: Reservation[];
    currentReservation: Reservation | null;
    fetchLoading: boolean;
    actionLoading: boolean;
    error: string | null;

    fetchReservations: () => Promise<void>;
    fetchReservationById: (id: string) => Promise<void>;
    createReservation: (data: any) => Promise<void>;
    cancelReservation: (id: string) => Promise<void>;
    clearError: () => void;
}

export const useReservationStore = create<ReservationState>()(
    persist(
        (set, get) => ({
            reservations: [],
            currentReservation: null,
            fetchLoading: false,
            actionLoading: false,
            error: null,

            fetchReservations: async () => {
                set({ fetchLoading: true, error: null });
                try {
                    const response = await api.get('/reservations/my');
                    set({ reservations: response.data.data || [], fetchLoading: false });
                } catch (err: any) {
                    const message = err.response?.data?.message || 'Failed to load reservations';
                    set({ error: message, fetchLoading: false });
                    toast.error(message);
                }
            },

            fetchReservationById: async (id: string) => {
                set({ fetchLoading: true, error: null });
                try {
                    const response = await api.get(`/reservations/${id}`);
                    set({ currentReservation: response.data.data || null, fetchLoading: false });
                } catch (err: any) {
                    const message = err.response?.data?.message || 'Failed to load reservation details';
                    set({ error: message, fetchLoading: false });
                    toast.error(message);
                }
            },

            createReservation: async (data) => {
                set({ actionLoading: true, error: null });
                try {
                    const response = await api.post('/reservations', data);
                    const newRes = response.data.data;
                    set((state) => ({
                        reservations: [...state.reservations, newRes],
                        actionLoading: false,
                    }));
                    toast.success('Reservation created successfully');
                } catch (err: any) {
                    const message = err.response?.data?.message || 'Failed to create reservation';
                    set({ error: message, actionLoading: false });
                    toast.error(message);
                    throw err;
                }
            },

            cancelReservation: async (id: string) => {
                // Optimistic update
                const original = get().reservations;
                set((state) => ({
                    reservations: state.reservations.map((res) =>
                        res._id === id ? { ...res, status: 'cancelled' } : res
                    ),
                    actionLoading: true,
                    error: null,
                }));

                try {
                    await api.delete(`/reservations/${id}`);
                    toast.success('Reservation cancelled');
                } catch (err: any) {
                    // Rollback on error
                    set({ reservations: original });
                    const message = err.response?.data?.message || 'Failed to cancel reservation';
                    set({ error: message, actionLoading: false });
                    toast.error(message);
                } finally {
                    set({ actionLoading: false });
                }
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'reservation-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                reservations: state.reservations,
                currentReservation: state.currentReservation,
            }),
        }
    )
);

// Optional: auto-fetch reservations on app load if authenticated
if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
        useReservationStore.getState().fetchReservations();
    }
}