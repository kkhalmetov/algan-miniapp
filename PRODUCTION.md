# Algan Mini App — production runbook

Актуально на 7 сентября 2026 года.

## Текущий статус

| Контур | Статус | Подтверждение |
| --- | --- | --- |
| HTTPS-домен | Готов | `https://algan-bot.online`, редирект с `www` |
| Telegram Main Mini App | Готов | `https://t.me/alganonline_bot?startapp` открывается как `Open App` |
| CI/CD на VPS | Готов | атомарные релизы, проверка commit marker, rollback после неуспешного smoke test и хранение пяти последних сборок |
| Frontend availability monitoring | Готов | GitHub Actions каждые два часа сверяет production SHA с `main`, служебные URL и security headers |
| Browser security | Готов для demo | CSP, HSTS, `nosniff`, referrer и permissions policy |
| Dependency hygiene | Готов | npm audit без уязвимостей, weekly Dependabot для npm и GitHub Actions |
| Telegram UI runtime | Готов | SDK до клиентского кода, `ready`, `expand`, stable viewport, content safe area, цвета и защита закрытия во время оплаты |
| Публичный demo | Готов | явно маркируется в интерфейсе, деньги не списываются |
| Реальный каталог и остатки | Заблокировано backend | frontend пока импортирует `lib/mock-data.ts` |
| Реальная оплата и заказ | Заблокировано backend/payment | текущий сценарий локальный и демонстрационный |
| Публичная оферта и правила заказа | Нужна юридическая редакция | в приложении пока заглушки |
| Наблюдаемость бизнес-операций | Заблокировано backend | нет серверных заказов, webhooks и correlation ID |

`npm run validate:env` не разрешит собрать `NEXT_PUBLIC_RELEASE_MODE=live`, пока последние три продуктовых блокера присутствуют в исходном коде.

## Режимы релиза

Demo production:

```dotenv
NEXT_PUBLIC_RELEASE_MODE=demo
NEXT_PUBLIC_DATA_MODE=mock
NEXT_PUBLIC_APP_ORIGIN=https://algan-bot.online
```

Live production после готовности backend:

```dotenv
NEXT_PUBLIC_RELEASE_MODE=live
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_BASE_URL=https://<api-host>/<base-path>
NEXT_PUBLIC_APP_ORIGIN=https://algan-bot.online
```

Публичные переменные не должны содержать токен Telegram-бота, ключ платёжного провайдера, JWT secret или другие секреты. Они принадлежат только backend/Vault/secret storage.

## Контракт, необходимый от backend

Frontend уже поддерживает обмен сырой строкой `Telegram.WebApp.initData` через `POST <base>/auth/telegram` и ожидает `access_token`. Для live-режима дополнительно нужны документированные и версионированные endpoint'ы:

1. Профиль покупателя: получить и обновить телефон/язык; юридическое согласие хранить на сервере с версией, временем и Telegram ID.
2. Каталог: города, заведения, боксы, локализованные поля, актуальные остатки, окна выдачи, аллергены и halal-признак.
3. Избранное: получить и атомарно изменить серверное состояние пользователя.
4. Корзина/заказ: сервер рассчитывает цену и остаток; клиентская сумма никогда не является источником истины.
5. Оплата: backend создаёт invoice у согласованного провайдера и обрабатывает подписанный webhook идемпотентно.
6. Заказы: заказ получает статус `paid` и код выдачи только после подтверждённой оплаты; повторный webhook не создаёт второй заказ.
7. Отмена/возврат: явная машина статусов, сроки, причина, аудит и восстановление остатка.

Обязательные общие свойства: OpenAPI-контракт, CORS только для `https://algan-bot.online`, rate limiting для auth/checkout, request ID, структурированные логи без `initData` и токенов, health/readiness endpoints, резервное копирование PostgreSQL и алерты на ошибки оплаты.

## Перед production backend

Репозиторий backend `yevgn/algan` в рамках этой работы только инспектируется и не изменяется. Его владельцу необходимо самостоятельно закрыть перед деплоем:

- убрать development defaults для БД, JWT и Telegram token; старт production должен завершаться ошибкой при отсутствии секретов;
- заменить wildcard CORS с credentials на точный frontend origin;
- убрать runtime devtools и SQL logging в production profile;
- закрыть Swagger в production или защитить авторизацией;
- добавить customer API, оплату, idempotency и интеграционные тесты;
- проверить TTL Telegram `initData` и ротацию ключей/сессий;
- развернуть API за HTTPS и передать frontend только публичный base URL.

## Telegram / BotFather checklist

- Main Mini App URL: `https://algan-bot.online/`.
- Menu Button ведёт на тот же HTTPS URL.
- Bot name, avatar, description и short description соответствуют бренду Algan.
- Для профиля Main Mini App загружены русские и казахские preview media.
- `/start`, сообщение поддержки и политика конфиденциальности ведут на актуальные ресурсы.
- Кнопка поддержки в Mini App открывает `@alganonline_bot`, а не личный аккаунт разработчика.
- Bot token хранится только на backend; после любого подозрения на утечку токен отзывается в BotFather.
- Auth backend валидирует исходный `initData`, подпись и свежесть; `initDataUnsafe` не используется как серверное доказательство личности.

## Go-live порядок

1. Юрист утверждает публичную оферту и правила заказа на русском и казахском; обновляется версия документов.
2. Backend-команда публикует OpenAPI и staging API, затем проходит security/integration review.
3. Frontend заменяет mock data/store/payment на API provider и добавляет contract/e2e тесты.
4. `NEXT_PUBLIC_API_BASE_URL` добавляется как GitHub repository variable.
5. VPS bootstrap повторно запускается от root с `API_ORIGIN=https://<api-host>` и контактным `LETSENCRYPT_EMAIL`, чтобы точный API origin попал в CSP `connect-src`, а Certbot мог отправлять уведомления о сертификате.
6. В staging запускается реальная тестовая оплата, проверяются success, decline, retry, duplicate webhook, cancel и refund.
7. Release gate должен пройти с `NEXT_PUBLIC_RELEASE_MODE=live` и `NEXT_PUBLIC_DATA_MODE=api`.
8. Переменные production переключаются на live; GitHub Actions публикует релиз и проверяет точный commit marker.
9. После запуска проверяются Telegram iOS, Android, Desktop и Web, метрики auth/checkout/payment и сценарий rollback.

## Команды проверки

```bash
npm ci
npm run validate:env
npm run lint
npm run typecheck
npm test
npm run build
```

После сборки `dist/client/release.json` содержит SHA, release mode и data mode. Workflow принимает релиз только если production возвращает SHA текущего GitHub commit и обязательные security headers.

Плановый workflow `Production smoke` каждые два часа повторяет внешнюю проверку. Его ошибка означает, что production недоступен, отстаёт от `main` или потерял обязательные Telegram/discovery/security элементы; уведомления о failed runs настраиваются владельцем репозитория в GitHub.
