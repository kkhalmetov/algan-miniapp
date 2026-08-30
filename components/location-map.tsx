'use client';

import { useEffect, useRef } from 'react';
import type { Store } from '@/lib/types';

interface Props {
  lat: number;
  lng: number;
  stores?: Pick<Store, 'id' | 'name' | 'logo' | 'lat' | 'lng'>[];
  interactiveMarker?: boolean;
  onChange?: (lat: number, lng: number) => void;
  onSelectStore?: (id: string) => void;
  className?: string;
}

export const storeMarkerHtml = (logo: string) => `<span aria-hidden="true"><img src="${logo}" alt="" /></span>`;

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
        const storeIcon = L.divIcon({
          className: 'algan-store-marker',
          html: storeMarkerHtml(store.logo),
          iconSize: [42, 42],
          iconAnchor: [21, 21],
        });
        const marker = L.marker([store.lat, store.lng], { icon: storeIcon, title: store.name }).addTo(map!);
        marker.on('click', () => onSelectStore?.(store.id));
      });

      setTimeout(() => map?.invalidateSize(), 30);
    });

    return () => {
      disposed = true;
      map?.remove();
    };
  }, [interactiveMarker, lat, lng, onChange, onSelectStore, stores]);

  return <div ref={containerRef} className={`z-0 ${className}`} role="region" aria-label="OpenStreetMap" />;
}
