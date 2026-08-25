# Algan Mini App

Покупательский Telegram Mini App для сервиса food rescue в Шымкенте. Пользователь выбирает локацию, находит боксы нереализованной еды со скидкой, добавляет заведения в избранное и проходит демонстрационный сценарий оплаты.

## Возможности MVP

- онбординг с обязательным именем и двумя согласиями;
- OpenStreetMap, ручной поиск адреса и текущая геопозиция;
- главная, карта, избранное и профиль;
- каталог и карточки боксов на реалистичных мок-данных;
- демо-оплата, код получения и локальная история заказов;
- русский и казахский интерфейсы;
- Telegram viewport, theme setup и haptic feedback;
- browser-demo режим для проверки без Telegram.

Юридические страницы являются заглушками, а деньги в MVP не списываются.

## Запуск

Требуется Node.js 22+.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Проверка перед публикацией:

```bash
npm run typecheck
npm test
npm run build
```

Статический production export находится в `dist/client`.

## Backend

Backend разрабатывается отдельно в `yevgn/algan` и этим репозиторием не изменяется. Из текущего контракта подключён:

```http
POST /auth/telegram
Content-Type: application/json

{ "init_data": "<Telegram.WebApp.initData>" }
```

Ответ: `{ "access_token": "..." }`. В API-режиме задайте `NEXT_PUBLIC_DATA_MODE=api` и `NEXT_PUBLIC_API_BASE_URL`.

Для последующей интеграции backend должен предоставить профиль и согласия, геолокацию, каталог заведений/боксов, избранное, оплаченные заказы и Telegram invoice flow. Текущая backend-семантика `RESERVED` не соответствует продуктовому требованию «без брони»: production-заказ должен фиксироваться только после подтверждённой оплаты.

## Карты

MVP использует стандартные OSM tiles и публичный Nominatim. Поиск выполняется только после явной отправки формы, без autocomplete, результаты не запрашиваются в фоне. Для массового коммерческого запуска endpoints необходимо заменить на выделенного OSM-провайдера.

## Фото

Фото скачаны с Unsplash и используются по Unsplash License:

- Sergio Arze — `wp3yOyh0xB4`;
- Ayla Meinberg — `6u5TKbPfTzo`;
- Engin Akyurt — `Z48qayubEFc`;
- Octavio Fossatti — `4hbCj6m11To`.

## Деплой

GitHub Actions проверяет и экспортирует приложение, загружает релиз на VPS и атомарно переключает symlink `current`. Нужны:

- repository variables: `VPS_HOST=92.38.49.57`, `VPS_USER=algan-deploy`;
- repository secrets: `VPS_SSH_PRIVATE_KEY`, `VPS_HOST_KEY`.

Первичная настройка VPS выполняется скриптом `deploy/bootstrap-vps.sh` от root с публичным ключом в `DEPLOY_PUBLIC_KEY`. Временный адрес: `https://92-38-49-57.sslip.io`.
