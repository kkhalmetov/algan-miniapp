const ORDER_ID_MIN = 10_000_000;
const ORDER_ID_RANGE = 90_000_000;

export const createOrderId = (existingIds: string[] = [], random = Math.random) => {
  const existing = new Set(existingIds);

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const id = String(Math.floor(random() * ORDER_ID_RANGE) + ORDER_ID_MIN);
    if (!existing.has(id)) return id;
  }

  throw new Error('Не удалось создать уникальный ID заказа');
};

export const formatOrderId = (id: string) => {
  if (/^\d{8}$/.test(id)) return id;

  const digits = id.replace(/\D/g, '');
  if (digits.length > 0) return digits.slice(-8).padStart(8, '0');

  let hash = 0;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return String((hash % ORDER_ID_RANGE) + ORDER_ID_MIN);
};
