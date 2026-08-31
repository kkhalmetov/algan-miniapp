export type Locale = 'ru' | 'kk';
export type Currency = 'KZT' | 'RUB';
export type Tab = 'home' | 'map' | 'favorites' | 'orders' | 'profile';

export interface UserProfile {
  telegramId?: number;
  firstName: string;
  lastName?: string;
  phone?: string;
  photoUrl?: string;
}

export interface LegalAcceptance {
  version: string;
  acceptedAt: string;
  locale: Locale;
  telegramId?: number;
  method: 'continue_button';
}

export interface UserLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface Store {
  id: string;
  name: string;
  logo: string;
  coverImage?: string;
  type: 'bakery' | 'cafe' | 'market' | 'dessert';
  address: string;
  addressKk?: string;
  lat: number;
  lng: number;
  rating: number;
}

export type BoxType = 'SURPRISE' | 'DEFINED';

export interface BoxContent {
  contentName: string;
  contentNameKk?: string;
  quantity: number;
}

export interface Box {
  id: string;
  storeId: string;
  type: BoxType;
  name: string;
  nameKk?: string;
  description: string;
  contents?: BoxContent[];
  originalPrice: number;
  salePrice: number;
  quantity: number;
  pickupFrom: string;
  pickupTo: string;
  image: string;
  allergens?: string;
  allergensKk?: string;
  isHalal: boolean;
  distanceKm: number;
}

export interface OrderItem {
  boxId: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  storeId: string;
  items: OrderItem[];
  total: number;
  pickupCode: string;
  createdAt: string;
  status: 'paid' | 'collected';
}

export interface CartItem {
  boxId: string;
  quantity: number;
}

export interface GeocodingResult {
  display_name: string;
  lat: string;
  lon: string;
}
