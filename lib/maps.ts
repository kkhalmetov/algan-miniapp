export type RouteProvider = '2gis' | 'yandex' | 'google' | 'apple';

export interface RouteOption {
  id: RouteProvider;
  label: string;
  url: string;
}

export function isAppleMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function getRouteOptions(lat: number, lng: number, includeApple = isAppleMobileDevice()): RouteOption[] {
  const destination = `${lat},${lng}`;
  const options: RouteOption[] = [
    {
      id: '2gis',
      label: '2GIS',
      url: `https://2gis.kz/shymkent/directions/points/${encodeURIComponent(`|${lng},${lat}`)}`,
    },
    {
      id: 'yandex',
      label: 'Яндекс Карты',
      url: `https://yandex.com/maps/?rtext=~${encodeURIComponent(destination)}&rtt=auto`,
    },
    {
      id: 'google',
      label: 'Google Maps',
      url: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`,
    },
  ];

  if (includeApple) {
    options.push({
      id: 'apple',
      label: 'Apple Maps',
      url: `https://maps.apple.com/?daddr=${encodeURIComponent(destination)}`,
    });
  }

  return options;
}
