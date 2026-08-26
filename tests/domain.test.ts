import { describe, expect, it } from 'vitest';
import { boxes, stores, storeById } from '../lib/mock-data';
import { getCopy } from '../lib/translations';

describe('mock customer catalog', () => {
  it('contains purchasable discounted boxes linked to stores', () => {
    expect(boxes).toHaveLength(4);
    expect(stores).toHaveLength(4);
    boxes.forEach((box) => {
      expect(box.salePrice).toBeLessThan(box.originalPrice);
      expect(box.quantity).toBeGreaterThan(0);
      expect(storeById(box.storeId)).toBeTruthy();
    });
  });

  it('provides matching Russian and Kazakh copy', () => {
    const ru = getCopy('ru');
    const kk = getCopy('kk');
    expect(ru('continue')).toBe('Продолжить');
    expect(kk('continue')).toBe('Жалғастыру');
    expect(ru('buy')).not.toBe(kk('buy'));
    expect(ru('orders')).toBe('Заказы');
    expect(kk('orders')).toBe('Тапсырыстар');
    expect(ru('businessDetails')).toBe('ИП «ALGAN» | ИИН 030705500040');
    expect(kk('businessDetails')).toBe('«ALGAN» ЖК | ЖСН 030705500040');
  });
});
