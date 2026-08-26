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
    expect(ru('privacy')).toBe('Я согласен на сбор и обработку персональных данных в соответствии с политикой конфиденциальности');
    expect(ru('buy')).not.toBe(kk('buy'));
    expect(ru('orders')).toBe('Заказы');
    expect(kk('orders')).toBe('Тапсырыстар');
    expect(ru('legal')).toBe('Правовая информация');
    expect(kk('legal')).toBe('Құқықтық ақпарат');
    expect(ru('nearby')).toBe('Доступные заведения');
    expect(kk('nearby')).toBe('Қолжетімді мекемелер');
    expect(ru('orderRulesTitle')).toBe('Правила заказа, получения, отмены и возврата');
    expect(kk('orderRulesTitle')).toBe('Тапсырыс беру, алу, бас тарту және қайтару ережелері');
  });
});
