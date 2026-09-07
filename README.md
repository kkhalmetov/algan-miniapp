# Algan Mini App

Покупательский Telegram Mini App для сервиса food rescue в Шымкенте. Пользователь находит боксы нереализованной еды со скидкой, сохраняет конкретные предложения в избранное и проходит демонстрационный сценарий оплаты.

Текущий публичный релиз — технически защищённый **demo production**: [algan-bot.online](https://algan-bot.online), запуск в Telegram — [@alganonline_bot](https://t.me/alganonline_bot?startapp). Режим `live` заблокирован автоматическим release gate до подключения серверного каталога, заказов, реальной оплаты и публикации двух оставшихся юридических документов. Полный статус и порядок запуска описаны в [PRODUCTION.md](./PRODUCTION.md).

## Возможности MVP

- онбординг с номером телефона и версионированным подтверждением юридических документов;
- OpenStreetMap, ручной поиск адреса и текущая геопозиция;
- главная, заказы, избранное и профиль;
- каталог и карточки боксов на реалистичных мок-данных;
- демо-оплата, код получения и локальная история заказов;
- русский и казахский интерфейсы;
- Telegram viewport, theme setup и haptic feedback;
- browser-demo режим для проверки без Telegram.

Условия использования, согласие на обработку персональных данных и политика конфиденциальности опубликованы на русском и казахском языках. Публичная оферта и правила заказа пока остаются заглушками, а деньги в MVP не списываются.

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
npm run lint
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

Ответ: `{ "access_token": "..." }`. В API-режиме задайте `NEXT_PUBLIC_DATA_MODE=api` и HTTPS-адрес в `NEXT_PUBLIC_API_BASE_URL`. Токен хранится только в памяти вкладки и после перезагрузки получается заново из подписанных Telegram `initData`.

Для последующей интеграции backend должен предоставить профиль и серверное подтверждение версии юридических документов, геолокацию, каталог заведений/боксов, избранное, оплаченные заказы и Telegram invoice flow. Текущая backend-семантика `RESERVED` не соответствует продуктовому требованию «без брони»: production-заказ должен фиксироваться только после подтверждённой оплаты.

## Карты

Приложение открывает маршрут к заведению через нативный Telegram API в 2GIS, Яндекс Картах, Google Maps или Apple Maps. Координаты не передаются сторонним сервисам до явного выбора пользователя.

## Фото

Фото скачаны с Unsplash и используются по Unsplash License:

- Sergio Arze — `wp3yOyh0xB4`;
- Ayla Meinberg — `6u5TKbPfTzo`;
- Engin Akyurt — `Z48qayubEFc`;
- Octavio Fossatti — `4hbCj6m11To`.

## Деплой

GitHub Actions проверяет и экспортирует приложение, загружает релиз на VPS и атомарно переключает symlink `current`. Нужны:

- repository variables: `VPS_HOST=92.38.49.57`, `VPS_USER=algan-deploy`;
- repository variables: `NEXT_PUBLIC_RELEASE_MODE=demo`, `NEXT_PUBLIC_DATA_MODE=mock`;
- repository secrets: `VPS_SSH_PRIVATE_KEY`, `VPS_HOST_KEY`.

Каждая поставка проходит lint, typecheck, полный набор тестов, production build и внешний smoke test по `release.json` и security headers. При неуспешном smoke test workflow автоматически возвращает предыдущий релиз. Плановый production smoke каждые два часа дополнительно проверяет SHA, служебные URL и security headers. Первичная настройка VPS выполняется скриптом `deploy/bootstrap-vps.sh` от root с публичным ключом в `DEPLOY_PUBLIC_KEY`. Production-адрес: `https://algan-bot.online`; `www` перенаправляется на основной домен.
