'use client';

import { useEffect, useRef } from 'react';

interface Props {
  lat: number;
  lng: number;
  stores?: { id: string; name: string; lat: number; lng: number }[];
  interactiveMarker?: boolean;
  onChange?: (lat: number, lng: number) => void;
  onSelectStore?: (id: string) => void;
  className?: string;
}

export default function LocationMap({ lat, lng, stores = [], interactiveMarker = false, onChange, onSelectStore, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;
    let map: import('leaflet').Map | undefined;

    void import('leaflet').then((L) => {
      if (disposed || !containerRef.current) return;
      map = L.map(containerRef.current, { zoomControl: false, attributionControl: true }).setView([lat, lng], interactiveMarker ? 15 : 13);
      L.control.zoom({ position: 'topright' }).addTo(map);
      L.tileLayer(process.env.NEXT_PUBLIC_OSM_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const markerIcon = L.divIcon({
        className: 'algan-user-marker',
        html: '<span aria-hidden="true"></span>',
        iconSize: [38, 46],
        iconAnchor: [19, 42],
      });
      const storeIcon = L.divIcon({
        className: 'algan-store-marker',
        html: '<span aria-hidden="true">a</span>',
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });

      if (interactiveMarker) {
        const marker = L.marker([lat, lng], { draggable: true, icon: markerIcon }).addTo(map);
        marker.on('dragend', () => {
          const point = marker.getLatLng();
          onChange?.(point.lat, point.lng);
        });
        map.on('click', (event) => {
          marker.setLatLng(event.latlng);
          onChange?.(event.latlng.lat, event.latlng.lng);
        });
      }

      stores.forEach((store) => {
        const marker = L.marker([store.lat, store.lng], { icon: storeIcon }).addTo(map!);
        marker.on('click', () => onSelectStore?.(store.id));
      });

      setTimeout(() => map?.invalidateSize(), 30);
    });

    return () => {
      disposed = true;
      map?.remove();
    };
  }, [interactiveMarker, lat, lng, onChange, onSelectStore, stores]);

  return <div ref={containerRef} className={`z-0 ${className}`} aria-label="OpenStreetMap" />;
}
