// src/components/shared/MapComponent.tsx
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { cn } from '@/lib/utils';
import Loader from '@/components/common/Loader';

// Fix default Leaflet icon (very common issue after CSS import)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

interface MapComponentProps {
    center?: [number, number]; // [lat, lng]
    zoom?: number;
    markers?: Array<{ lat: number; lng: number; popup?: string }>;
    height?: string;
    className?: string;
    onMapReady?: (map: L.Map) => void; // optional callback
}

const defaultCenter: [number, number] = [9.03, 38.74]; // Addis Ababa
const defaultZoom = 13;

export default function MapComponent({
    center = defaultCenter,
    zoom = defaultZoom,
    markers = [],
    height = '400px',
    className = '',
    onMapReady,
}: MapComponentProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);
    const [isMapReady, setIsMapReady] = useState(false);

    useEffect(() => {
        if (!mapRef.current) return;

        try {
            // Initialize map only once
            if (!leafletMap.current) {
                leafletMap.current = L.map(mapRef.current, {
                    zoomControl: true,
                    attributionControl: true,
                }).setView(center, zoom);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    maxZoom: 19,
                }).addTo(leafletMap.current);

                setIsMapReady(true);
                onMapReady?.(leafletMap.current);
            }

            // Update view if center/zoom changes
            leafletMap.current.setView(center, zoom);

            // Clear old markers
            markersRef.current.forEach((marker) => marker.remove());
            markersRef.current = [];

            // Add new markers
            markers.forEach((marker) => {
                const popupContent = marker.popup || 'Location';
                const newMarker = L.marker([marker.lat, marker.lng])
                    .addTo(leafletMap.current!)
                    .bindPopup(popupContent);

                markersRef.current.push(newMarker);
            });

            // Auto-fit bounds if markers exist
            if (markers.length > 0) {
                const group = L.featureGroup(markersRef.current);
                leafletMap.current.fitBounds(group.getBounds(), { padding: [50, 50] });
            }
        } catch (err) {
            console.error('Map initialization failed:', err);
        }

        // Cleanup on unmount
        return () => {
            if (leafletMap.current) {
                leafletMap.current.remove();
                leafletMap.current = null;
            }
            markersRef.current = [];
        };
    }, [center, zoom, markers, onMapReady]);

    return (
        <div
            className={cn(
                'w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 relative',
                className
            )}
            style={{ height }}
        >
            {/* Loading overlay */}
            {!isMapReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900 bg-opacity-80">
                    <Loader size="lg" />
                </div>
            )}

            <div ref={mapRef} className="h-full w-full" />
        </div>
    );
}