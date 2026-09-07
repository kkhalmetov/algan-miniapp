const ORDER_ID_MIN = 10_000_000;
const ORDER_ID_RANGE = 90_000_000;

const secureRandom = () => {
  const value = new Uint32Array(1);
  globalThis.crypto.getRandomValues(value);
  return value[0] / 0x1_0000_0000;
};

export const createOrderId = (existingIds: string[] = [], random = secureRandom) => {
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

export const normalizePickupCode = (code: string) => {
  const digits = code.replace(/\D/g, '');
  return digits.slice(-6).padStart(6, '0');
};

export const formatPickupCode = (code: string) => {
  const normalized = normalizePickupCode(code);
  return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
};

export const createPickupCode = (existingCodes: string[] = [], random = secureRandom) => {
  const existing = new Set(existingCodes.map(normalizePickupCode));
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const code = String(Math.floor(random() * 1_000_000)).padStart(6, '0');
    if (!existing.has(code)) return code;
  }
  throw new Error('Не удалось создать уникальный код получения');
};

export const createOrderQrPayload = (orderId: string, pickupCode: string) =>
  `ALGAN|ORDER=${formatOrderId(orderId)}|CODE=${normalizePickupCode(pickupCode)}`;
