import type { Box, Order, Store } from './types';

export const stores: Store[] = [
  { id: 'tatti', name: 'Tatti Bakery', logo: '/images/store-logos/tatti.svg', coverImage: '/images/bakery.jpg', type: 'bakery', address: 'пр. Тауке хана, 47', lat: 42.3184, lng: 69.5907, rating: 4.9 },
  { id: 'kofi', name: 'Köfi', logo: '/images/store-logos/kofi.svg', coverImage: '/images/cafe.jpg', type: 'cafe', address: 'ул. Байтурсынова, 12', lat: 42.3122, lng: 69.5823, rating: 4.8 },
  { id: 'dastarhan', name: 'Dastarhan Market', logo: '/images/store-logos/dastarhan.svg', coverImage: '/images/produce.jpg', type: 'market', address: 'ул. Желтоксан, 19', lat: 42.3268, lng: 69.5979, rating: 4.7 },
  { id: 'bal', name: 'Bal Dessert', logo: '/images/store-logos/bal.svg', coverImage: '/images/dessert.jpg', type: 'dessert', address: 'пр. Кунаева, 38', lat: 42.3058, lng: 69.6038, rating: 4.9 },
  { id: 'qamyr', name: 'Qamyr Bakery', logo: '/images/store-logos/qamyr.svg', coverImage: '/images/bakery.jpg', type: 'bakery', address: 'ул. Рыскулова, 18', lat: 42.321, lng: 69.5795, rating: 4.8 },
];

export const boxes: Box[] = [
  {
    id: 'bakery-surprise', storeId: 'tatti', type: 'SURPRISE', name: 'Surprise Tatti-box',
    description: 'В набор могут попасться круассаны, слойки, булочки, багеты и другая выпечка.',
    originalPrice: 6200, salePrice: 2490, quantity: 4, pickupFrom: '19:30', pickupTo: '20:30',
    image: '/images/bakery.jpg', allergens: 'Глютен, молоко, яйца', isHalal: true, distanceKm: 0.8,
  },
  {
    id: 'tatti-defined', storeId: 'tatti', type: 'DEFINED', name: 'Tatti-box',
    description: 'Набор свежей выпечки с заранее известным составом.',
    contents: [
      { contentName: 'Круассан', quantity: 2 },
      { contentName: 'Булочка с корицей', quantity: 1 },
      { contentName: 'Багет', quantity: 1 },
    ],
    originalPrice: 5600, salePrice: 2390, quantity: 3, pickupFrom: '18:30', pickupTo: '19:30',
    image: '/images/bakery.jpg', allergens: 'Глютен, молоко, яйца', isHalal: true, distanceKm: 0.8,
  },
  {
    id: 'tatti-morning', storeId: 'tatti', type: 'DEFINED', name: 'Утренний Tatti-box',
    description: 'Готовый набор выпечки для завтрака.',
    contents: [
      { contentName: 'Круассан', quantity: 2 },
      { contentName: 'Булочка', quantity: 1 },
      { contentName: 'Бейгл', quantity: 1 },
    ],
    originalPrice: 4200, salePrice: 1790, quantity: 5, pickupFrom: '10:30', pickupTo: '11:30',
    image: '/images/bakery.jpg', allergens: 'Глютен, молоко, яйца', isHalal: true, distanceKm: 0.8,
  },
  {
    id: 'tatti-family', storeId: 'tatti', type: 'DEFINED', name: 'Семейный Tatti-box',
    description: 'Большой набор свежей выпечки для всей семьи.',
    contents: [
      { contentName: 'Багет', quantity: 1 },
      { contentName: 'Круассан', quantity: 4 },
      { contentName: 'Булочка с корицей', quantity: 2 },
    ],
    originalPrice: 8900, salePrice: 3790, quantity: 1, pickupFrom: '19:00', pickupTo: '20:00',
    image: '/images/bakery.jpg', allergens: 'Глютен, молоко, яйца', isHalal: true, distanceKm: 0.8,
  },
  {
    id: 'tatti-evening-surprise', storeId: 'tatti', type: 'SURPRISE', name: 'Вечерний Surprise Tatti-box',
    description: 'В набор могут попасться круассаны, слойки, хлеб, булочки и другая выпечка.',
    originalPrice: 5800, salePrice: 2290, quantity: 2, pickupFrom: '20:00', pickupTo: '21:00',
    image: '/images/bakery.jpg', allergens: 'Глютен, молоко, яйца', isHalal: true, distanceKm: 0.8,
  },
  {
    id: 'coffee-pair', storeId: 'kofi', type: 'DEFINED', name: 'Кофе & булочки',
    description: 'Два напитка и выпечка, которые особенно хороши для неспешного вечера.',
    contents: [
      { contentName: 'Кофейный напиток', quantity: 2 },
      { contentName: 'Булочка', quantity: 2 },
    ],
    originalPrice: 4800, salePrice: 1990, quantity: 3, pickupFrom: '20:00', pickupTo: '21:00',
    image: '/images/cafe.jpg', allergens: 'Молоко, глютен, орехи', isHalal: true, distanceKm: 1.2,
  },
  {
    id: 'green-box', storeId: 'dastarhan', type: 'DEFINED', name: 'Зелёный бокс',
    description: 'Овощи, фрукты и зелень с небольшими внешними несовершенствами, но отличным вкусом.',
    contents: [
      { contentName: 'Овощной набор', quantity: 1 },
      { contentName: 'Фруктовый набор', quantity: 1 },
      { contentName: 'Зелень', quantity: 1 },
    ],
    originalPrice: 7000, salePrice: 2890, quantity: 6, pickupFrom: '18:00', pickupTo: '20:00',
    image: '/images/produce.jpg', isHalal: true, distanceKm: 1.9,
  },
  {
    id: 'sweet-evening', storeId: 'bal', type: 'DEFINED', name: 'Сладкий вечер',
    description: 'Ассорти десертов дня: мини-торты, тарталетки и нежные пирожные.',
    contents: [
      { contentName: 'Мини-торт', quantity: 1 },
      { contentName: 'Тарталетка', quantity: 2 },
      { contentName: 'Пирожное', quantity: 2 },
    ],
    originalPrice: 7600, salePrice: 3190, quantity: 2, pickupFrom: '20:30', pickupTo: '21:30',
    image: '/images/dessert.jpg', allergens: 'Молоко, яйца, глютен, орехи', isHalal: true, distanceKm: 2.4,
  },
  {
    id: 'qamyr-evening', storeId: 'qamyr', type: 'DEFINED', name: 'Вечерний бокс',
    description: 'Выпечка и хлеб, оставшиеся к концу дня.',
    contents: [
      { contentName: 'Хлеб', quantity: 1 },
      { contentName: 'Слойка', quantity: 2 },
    ],
    originalPrice: 5400, salePrice: 2190, quantity: 0, pickupFrom: '20:00', pickupTo: '21:00',
    image: '/images/bakery.jpg', allergens: 'Глютен, молоко, яйца', isHalal: true, distanceKm: 1.5,
  },
];

export const demoPastOrder: Order = {
  id: '48273106',
  storeId: 'bal',
  items: [
    { boxId: 'sweet-evening', quantity: 1, unitPrice: 3190 },
  ],
  total: 3190,
  pickupCode: '418205',
  createdAt: '2026-08-24T15:30:00.000Z',
  status: 'collected',
};

export const storeById = (id: string) => stores.find((store) => store.id === id)!;
