import { describe, expect, it } from 'vitest';
import { boxes, stores, storeById } from '../lib/mock-data';
import { getCopy } from '../lib/translations';

describe('mock customer catalog', () => {
  it('contains available and sold-out discounted boxes linked to stores', () => {
    expect(boxes).toHaveLength(9);
    expect(stores).toHaveLength(5);
    expect(boxes.filter((box) => box.storeId === 'tatti')).toHaveLength(5);
    expect(boxes.filter((box) => box.storeId === 'tatti' && box.type === 'SURPRISE')).toHaveLength(2);
    expect(boxes.filter((box) => box.storeId === 'tatti' && box.type === 'DEFINED')).toHaveLength(3);
    boxes.forEach((box) => {
      expect(box.salePrice).toBeLessThan(box.originalPrice);
      expect(box.quantity).toBeGreaterThanOrEqual(0);
      expect(storeById(box.storeId)).toBeTruthy();
    });
    expect(boxes.some((box) => box.quantity === 0)).toBe(true);
  });

  it('gives every mock store its own local SVG logo', () => {
    expect(new Set(stores.map((store) => store.logo)).size).toBe(stores.length);
    stores.forEach((store) => expect(store.logo).toMatch(/^\/images\/store-logos\/.+\.svg$/));
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
    expect(ru('support')).toBe('Помощь и поддержка');
    expect(kk('support')).toBe('Көмек және қолдау');
    expect(ru('contacts')).toBe('Контакты');
    expect(kk('contacts')).toBe('Байланыс деректері');
    expect(ru('nearby')).toBe('Доступные заведения');
    expect(kk('nearby')).toBe('Қолжетімді мекемелер');
    expect(ru('buildRoute')).toBe('Построить маршрут');
    expect(kk('buildRoute')).toBe('Бағыт құру');
    expect(ru('pickupTime')).toBe('Время выдачи');
    expect(kk('pickupTime')).toBe('Алу уақыты');
    expect(ru('containsAllergens')).toBe('Содержит аллергены');
    expect(kk('containsAllergens')).toBe('Құрамында аллергендер бар');
    expect(ru('orderRulesTitle')).toBe('Правила заказа, оплаты, получения, отмены и возврата');
    expect(kk('orderRulesTitle')).toBe('Тапсырыс беру, төлеу, алу, бас тарту және қайтару ережелері');
    expect(ru('paymentFailedTitle')).toBe('Оплата не прошла');
    expect(kk('paymentFailedTitle')).toBe('Төлем өтпеді');
    expect(ru('backToCart')).toBe('Вернуться в корзину');
    expect(kk('backToCart')).toBe('Себетке оралу');
  });
});
