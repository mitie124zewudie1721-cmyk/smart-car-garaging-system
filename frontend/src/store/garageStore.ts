// src/store/garageStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export interface Garage {
    _id: string;
    name: string;
    address: string;
    lat?: number;
    lng?: number;
    capacity: number;
    availableSlots: number;
    pricePerHour: number;
    description?: string;
    amenities: string[];
    images?: string[];
    rating: number;
    createdAt: string;
    owner?: string; // optional: garage owner ID/reference
}

interface GarageState {
    myGarages: Garage[];
    currentGarage: Garage | null;
    loading: boolean;
    actionLoading: boolean;
    error: string | null;

    fetchMyGarages: () => Promise<void>;
    fetchGarageById: (id: string) => Promise<void>;
    addGarage: (data: Partial<Garage>) => Promise<void>;
    updateGarage: (id: string, data: Partial<Garage>) => Promise<void>;
    deleteGarage: (id: string) => Promise<void>;
    setError: (msg: string | null) => void;
    clearError: () => void;
}

export const useGarageStore = create<GarageState>()(
    persist(
        (set, _get) => ({
            myGarages: [],
            currentGarage: null,
            loading: false,
            actionLoading: false,
            error: null,

            fetchMyGarages: async () => {
                set({ loading: true, error: null });
                try {
                    const response = await api.get('/garages/my');
                    set({ myGarages: response.data.data || [], loading: false });
                } catch (err: any) {
                    const message = err.response?.data?.message || 'Failed to load your garages';
                    set({ error: message, loading: false });
                    toast.error(message);
                }
            },

            fetchGarageById: async (id: string) => {
                set({ loading: true, error: null });
                try {
                    const response = await api.get(`/garages/${id}`);
                    set({ currentGarage: response.data.data || null, loading: false });
                } catch (err: any) {
                    const message = err.response?.data?.message || 'Failed to load garage details';
                    set({ error: message, loading: false });
                    toast.error(message);
                }
            },

            addGarage: async (data) => {
                set({ actionLoading: true, error: null });
                try {
                    const response = await api.post('/garages', data);
                    const newGarage = response.data.data;
                    set((state) => ({
                        myGarages: [...state.myGarages, newGarage],
                        actionLoading: false,
                    }));
                    toast.success('Garage added successfully');
                } catch (err: any) {
                    const message = err.response?.data?.message || 'Failed to add garage';
                    set({ error: message, actionLoading: false });
                    toast.error(message);
                    throw err;
                }
            },

            updateGarage: async (id, data) => {
                set({ actionLoading: true, error: null });
                try {
                    const response = await api.put(`/garages/${id}`, data);
                    const updated = response.data.data;
                    set((state) => ({
                        myGarages: state.myGarages.map((g) => (g._id === id ? updated : g)),
                        currentGarage: state.currentGarage?._id === id ? updated : state.currentGarage,
                        actionLoading: false,
                    }));
                    toast.success('Garage updated');
                } catch (err: any) {
                    const message = err.response?.data?.message || 'Failed to update garage';
                    set({ error: message, actionLoading: false });
                    toast.error(message);
                }
            },

            deleteGarage: async (id) => {
                set({ actionLoading: true, error: null });
                try {
                    await api.delete(`/garages/${id}`);
                    set((state) => ({
                        myGarages: state.myGarages.filter((g) => g._id !== id),
                        currentGarage: state.currentGarage?._id === id ? null : state.currentGarage,
                        actionLoading: false,
                    }));
                    toast.success('Garage deleted');
                } catch (err: any) {
                    const message = err.response?.data?.message || 'Failed to delete garage';
                    set({ error: message, actionLoading: false });
                    toast.error(message);
                }
            },

            setError: (msg) => set({ error: msg }),
            clearError: () => set({ error: null }),
        }),
        {
            name: 'garage-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                myGarages: state.myGarages,
                currentGarage: state.currentGarage,
            }),
        }
    )
);

// Optional: auto-fetch on store creation (if token exists)
if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
        useGarageStore.getState().fetchMyGarages();
    }
}