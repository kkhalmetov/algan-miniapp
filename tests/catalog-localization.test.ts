import { describe, expect, it } from 'vitest';
import { boxAllergens, boxContentName, boxName, storeAddress } from '../lib/catalog-localization';
import { boxes, stores } from '../lib/mock-data';

describe('catalog localization', () => {
  it('uses full Kazakh catalog copy when it is available', () => {
    const store = stores.find((item) => item.id === 'tatti')!;
    const morningBox = boxes.find((item) => item.id === 'tatti-morning')!;
    const definedBox = boxes.find((item) => item.id === 'tatti-defined')!;

    expect(storeAddress(store, 'kk')).toBe('Тәуке хан даңғылы, 47');
    expect(boxName(morningBox, 'kk')).toBe('Таңғы Tatti-box');
    expect(boxAllergens(definedBox, 'kk')).toBe('Глютен, сүт, жұмыртқа');
    expect(boxContentName(definedBox.contents![1]!, 'kk')).toBe('Даршын қосылған тоқаш');
  });

  it('keeps Russian as the source fallback for backend-compatible records', () => {
    const store = { ...stores[0]!, addressKk: undefined };
    const box = { ...boxes[0]!, nameKk: undefined, allergensKk: undefined };
    const content = { contentName: 'Булочка', quantity: 1 };

    expect(storeAddress(store, 'kk')).toBe(store.address);
    expect(boxName(box, 'kk')).toBe(box.name);
    expect(boxAllergens(box, 'kk')).toBe(box.allergens);
    expect(boxContentName(content, 'kk')).toBe('Булочка');
  });
});
