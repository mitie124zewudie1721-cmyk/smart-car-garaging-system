// src/components/car-owner/GarageSearchMap.tsx
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { cn } from '@/lib/utils';
import Loader from '@/components/common/Loader';

interface Garage {
    _id: string;
    name: string;
    lat: number;
    lng: number;
    pricePerHour: number;
    availableSlots: number;
    distance?: number;
}

interface GarageSearchMapProps {
    garages: Garage[];
    userLocation: { lat: number; lng: number } | null;
    onSelectGarage?: (garage: Garage) => void;
    height?: string;
    className?: string;
    isLoading?: boolean;
}

const JIMMA_CENTER: [number, number] = [7.6769, 36.8344]; // Jimma city center
const JIMMA_ZOOM = 13;

// Fix default Leaflet marker icon (very common issue)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

export default function GarageSearchMap({
    garages,
    userLocation,
    onSelectGarage,
    height = '500px',
    className = '',
    isLoading = false,
}: GarageSearchMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);
    const [mapError, setMapError] = useState<string | null>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        try {
            // Initialize map only once
            if (!leafletMap.current) {
                leafletMap.current = L.map(mapRef.current, {
                    zoomControl: false,
                    attributionControl: true,
                    zoomAnimation: true,
                    fadeAnimation: true,
                    maxBounds: L.latLngBounds([7.45, 36.65], [7.90, 37.05]),
                    maxBoundsViscosity: 0.9,
                    minZoom: 11,
                }).setView(JIMMA_CENTER, JIMMA_ZOOM);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                    maxZoom: 19,
                }).addTo(leafletMap.current);

                L.control.zoom({ position: 'topright' }).addTo(leafletMap.current);
            }

            // Update user location marker
            if (userLocation) {
                L.circleMarker([userLocation.lat, userLocation.lng], {
                    radius: 12,
                    fillColor: '#3b82f6',
                    color: '#ffffff',
                    weight: 3,
                    opacity: 1,
                    fillOpacity: 0.8,
                })
                    .addTo(leafletMap.current)
                    .bindPopup('Your Location');
            }

            // Clear old markers
            markersRef.current.forEach((marker) => marker.remove());
            markersRef.current = [];

            // Add garage markers
            garages.forEach((garage) => {
                const marker = L.marker([garage.lat, garage.lng], {
                    riseOnHover: true,
                })
                    .addTo(leafletMap.current!)
                    .bindPopup(`
            <div class="text-sm min-w-[200px]">
              <h3 class="font-bold text-base mb-1">${garage.name}</h3>
              <p class="text-gray-700">
                ETB ${garage.pricePerHour} · ${garage.availableSlots} slots left
              </p>
              ${garage.distance ? `<p class="text-gray-600 mt-1">${garage.distance.toFixed(1)} km away</p>` : ''}
              <button 
                class="reserve-btn mt-3 w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition text-sm font-medium"
                data-garage-id="${garage._id}"
              >
                Reserve Now
              </button>
            </div>
          `);

                // Better way: use popupopen event to attach click listener
                marker.on('popupopen', () => {
                    const btn = document.querySelector(`.reserve-btn[data-garage-id="${garage._id}"]`);
                    if (btn) {
                        btn.addEventListener('click', () => {
                            onSelectGarage?.(garage);
                            marker.closePopup();
                        });
                    }
                });

                markersRef.current.push(marker);
            });

            // Auto-fit bounds if there are garages — stay within Jimma
            if (garages.length > 0) {
                const group = L.featureGroup(markersRef.current);
                const bounds = group.getBounds();
                // Clamp to Jimma bounding box so map never zooms out to Africa
                const jimmaBounds = L.latLngBounds([7.55, 36.75], [7.80, 36.95]);
                leafletMap.current.fitBounds(bounds.intersects(jimmaBounds) ? bounds : jimmaBounds, { padding: [40, 40], maxZoom: 15 });
            } else {
                leafletMap.current.setView(JIMMA_CENTER, JIMMA_ZOOM);
            }
        } catch (err) {
            console.error('Map initialization error:', err);
            setMapError('Failed to load map. Please check your connection.');
        }

        // Cleanup on unmount
        return () => {
            markersRef.current.forEach((marker) => marker.remove());
            markersRef.current = [];
        };
    }, [garages, userLocation, onSelectGarage]);

    if (mapError) {
        return (
            <div className={cn('w-full rounded-xl overflow-hidden border border-red-300 bg-red-50 dark:bg-red-950/30 p-6 text-center text-red-700 dark:text-red-300', className)}>
                {mapError}
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className={cn('w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center', className)} style={{ height }}>
                <Loader size="lg" />
            </div>
        );
    }

    return (
        <div
            ref={mapRef}
            className={cn(
                'w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md',
                className
            )}
            style={{ height }}
        />
    );
}