import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';

const createStorage = (): Storage => {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, String(value)); },
  };
};

Object.defineProperty(globalThis, 'localStorage', { value: createStorage(), configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: createStorage(), configurable: true });

beforeEach(() => {
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
});
