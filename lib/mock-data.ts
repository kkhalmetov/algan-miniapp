import type { Box, Store } from './types';

export const stores: Store[] = [
  { id: 'tatti', name: 'Tatti Bakery', type: 'bakery', address: 'пр. Тауке хана, 47', lat: 42.3184, lng: 69.5907, rating: 4.9 },
  { id: 'kofi', name: 'Köfi', type: 'cafe', address: 'ул. Байтурсынова, 12', lat: 42.3122, lng: 69.5823, rating: 4.8 },
  { id: 'dastarhan', name: 'Dastarhan Market', type: 'market', address: 'ул. Желтоксан, 19', lat: 42.3268, lng: 69.5979, rating: 4.7 },
  { id: 'bal', name: 'Bal Dessert', type: 'dessert', address: 'пр. Кунаева, 38', lat: 42.3058, lng: 69.6038, rating: 4.9 },
];

export const boxes: Box[] = [
  {
    id: 'bakery-surprise', storeId: 'tatti', name: 'Большой bakery box',
    description: 'Свежая выпечка дня: круассаны, слойки и хлеб. Точный состав станет сюрпризом.',
    originalPrice: 6200, salePrice: 2490, quantity: 4, pickupFrom: '19:30', pickupTo: '20:30',
    image: '/images/bakery.jpg', allergens: 'Глютен, молоко, яйца', isHalal: true, distanceKm: 0.8,
  },
  {
    id: 'coffee-pair', storeId: 'kofi', name: 'Кофе & булочки',
    description: 'Два напитка и выпечка, которые особенно хороши для неспешного вечера.',
    originalPrice: 4800, salePrice: 1990, quantity: 3, pickupFrom: '20:00', pickupTo: '21:00',
    image: '/images/cafe.jpg', allergens: 'Молоко, глютен, орехи', isHalal: true, distanceKm: 1.2,
  },
  {
    id: 'green-box', storeId: 'dastarhan', name: 'Зелёный бокс',
    description: 'Овощи, фрукты и зелень с небольшими внешними несовершенствами, но отличным вкусом.',
    originalPrice: 7000, salePrice: 2890, quantity: 6, pickupFrom: '18:00', pickupTo: '20:00',
    image: '/images/produce.jpg', isHalal: true, distanceKm: 1.9,
  },
  {
    id: 'sweet-evening', storeId: 'bal', name: 'Сладкий вечер',
    description: 'Ассорти десертов дня: мини-торты, тарталетки и нежные пирожные.',
    originalPrice: 7600, salePrice: 3190, quantity: 2, pickupFrom: '20:30', pickupTo: '21:30',
    image: '/images/dessert.jpg', allergens: 'Молоко, яйца, глютен, орехи', isHalal: true, distanceKm: 2.4,
  },
];

export const storeById = (id: string) => stores.find((store) => store.id === id)!;
