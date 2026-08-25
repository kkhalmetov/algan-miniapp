export type Locale = 'ru' | 'kk';
export type Tab = 'home' | 'map' | 'favorites' | 'profile';

export interface UserProfile {
  firstName: string;
  lastName?: string;
  phone?: string;
}

export interface UserLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface Store {
  id: string;
  name: string;
  type: 'bakery' | 'cafe' | 'market' | 'dessert';
  address: string;
  lat: number;
  lng: number;
  rating: number;
}

export interface Box {
  id: string;
  storeId: string;
  name: string;
  description: string;
  originalPrice: number;
  salePrice: number;
  quantity: number;
  pickupFrom: string;
  pickupTo: string;
  image: string;
  allergens?: string;
  isHalal: boolean;
  distanceKm: number;
}

export interface Order {
  id: string;
  boxId: string;
  quantity: number;
  total: number;
  pickupCode: string;
  createdAt: string;
  status: 'paid' | 'collected';
}

export interface GeocodingResult {
  display_name: string;
  lat: string;
  lon: string;
}
