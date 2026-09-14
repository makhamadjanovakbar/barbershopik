# Барбершопик — мужской барбершоп

Полный стек автоматизации барбершопа: лендинг, онлайн-запись через сайт и Telegram-бота, админка для управления барберами, услугами, расписанием и записями.

## Стек

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS** — лендинг, запись, админка, API
- **Prisma + SQLite** — единая база данных для сайта и бота
- **Grammy** — Telegram-бот (отдельный процесс, использует ту же БД и общую booking-логику)
- **Auth админки** — вход по паролю из `.env` + подписанная HMAC cookie

## Структура

```
.
├── app/                    # Next.js: страницы и API
│   ├── page.tsx            # лендинг
│   ├── book/               # страница записи
│   ├── admin/              # админка
│   └── api/                # API-роуты
├── bot/                    # Telegram-бот (Grammy)
│   ├── index.ts            # точка входа
│   ├── context.ts          # тип сессии
│   ├── keyboards.ts        # inline-клавиатуры
│   └── handlers/           # обработчики команд и callback
├── components/             # UI-компоненты
│   ├── ui/                 # примитивы (Button, Input, Card, Table, ...)
│   ├── landing/            # секции лендинга
│   ├── booking/            # компоненты записи
│   └── admin/              # компоненты админки
├── lib/
│   ├── booking/            # общая логика слотов и записи
│   ├── api/                # http-хелперы, валидаторы, сериализаторы
│   ├── utils/              # даты, телефоны
│   ├── auth.ts             # админ-сессия
│   ├── prisma.ts           # singleton PrismaClient
│   ├── errors.ts           # коды ошибок и маппинг статусов
│   └── constants.ts        # единые константы
├── prisma/
│   ├── schema.prisma       # модели
│   └── seed.ts             # демо-данные
├── types/                  # общие TS-типы
└── .env.example
```

## Быстрый старт

### 1. Требования

- Node.js **20+**
- npm
- Токен Telegram-бота (получить у [@BotFather](https://t.me/BotFather)) — опционально, только для `npm run bot`

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка окружения

Скопируй шаблон и заполни своими значениями:

```bash
cp .env.example .env
```

Открой `.env` и укажи:

| Переменная | Что это |
|---|---|
| `DATABASE_URL` | Оставить как есть: `file:./dev.db` |
| `ADMIN_PASSWORD` | Пароль для входа в `/admin`. Придумай свой. |
| `TELEGRAM_BOT_TOKEN` | Токен бота от @BotFather (нужен только для `npm run bot`) |
| `NEXT_PUBLIC_BOT_USERNAME` | Юзернейм бота без `@` — показывается на лендинге |

> `.env` **не коммитится** в git. В репозиторий попадает только `.env.example` с фейковыми значениями.

### 4. Инициализация базы данных

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

После этого в `prisma/` появится файл `dev.db` с 3 барберами, 4 услугами и расписанием Пн–Сб 10:00–20:00.

Цены в seed — в узбекских сумах:
- Мужская стрижка — 60 000 сум (45 мин)
- Стрижка бороды — 40 000 сум (30 мин)
- Стрижка + борода — 90 000 сум (75 мин)
- Бритьё опасной бритвой — 50 000 сум (40 мин)

### 5. Запуск

**Сайт** (лендинг + `/book` + `/admin`):

```bash
npm run dev
```

Открой [http://localhost:3000](http://localhost:3000).

**Telegram-бот** (в отдельном терминале):

```bash
npm run bot
```

Сайт и бот используют **одну и ту же базу** и **общую booking-логику** из `lib/booking/`. Если клиент занял слот на сайте — бот сразу видит, что время недоступно, и наоборот.

## Админка

Открой [http://localhost:3000/admin/login](http://localhost:3000/admin/login) и введи пароль из `ADMIN_PASSWORD`.

Разделы:

- **Загруженность** — сводка по всем барберам на выбранный день, процент занятости и список записей
- **Записи** — все брони с сайта и бота, фильтры по дате/барберу/статусу, отмена/восстановление/удаление
- **Барберы** — CRUD, включение/скрытие
- **Услуги** — CRUD (название, длительность, цена в сумах)
- **Расписание** — рабочие дни и часы по каждому барберу

## API

### Публичные

| Метод | Endpoint | Описание |
|---|---|---|
| `GET` | `/api/services` | Список активных услуг |
| `GET` | `/api/barbers` | Список активных барберов |
| `GET` | `/api/availability?serviceId&date[&barberId]` | Свободные слоты |
| `POST` | `/api/bookings` | Создать запись |
| `GET` | `/api/bookings?id=N` | Одна запись по ID |
| `GET` | `/api/bookings?telegramId=X` | Активные записи клиента |

### Под авторизацией (`/api/admin/*`)

| Метод | Endpoint | Описание |
|---|---|---|
| `POST` | `/api/admin/login` | Вход (пароль в body) |
| `POST` | `/api/admin/logout` | Выход |
| `GET/POST` | `/api/admin/barbers` | Список / создание |
| `PATCH/DELETE` | `/api/admin/barbers/:id` | Обновление / удаление |
| `GET/POST` | `/api/admin/services` | Список / создание |
| `PATCH/DELETE` | `/api/admin/services/:id` | Обновление / удаление |
| `GET/POST` | `/api/admin/schedule` | Расписание барбера / создание интервала |
| `PATCH/DELETE` | `/api/admin/schedule/:id` | Обновление / удаление интервала |
| `GET` | `/api/admin/bookings` | Все записи (фильтры: `from`, `to`, `barberId`, `status`) |
| `PATCH/DELETE` | `/api/admin/bookings/:id` | Смена статуса / удаление |
| `GET` | `/api/admin/workload?date=YYYY-MM-DD` | Загруженность по барберам на день |

## Модель данных

- **Barber** — имя, `avatarUrl`, `active`
- **Service** — название, `durationMin`, `price` (в сумах), `active`
- **WorkSchedule** — барбер + день недели (0=Вс…6=Сб) + `startTime`/`endTime` (`"HH:MM"`)
- **ScheduleException** — выходной или особые часы на конкретную дату
- **Booking** — барбер, услуга, клиент (`clientName`, `clientPhone`, `telegramId?`), `startsAt`, `endsAt`, `status` (`confirmed` / `cancelled`), `source` (`web` / `telegram`)

## Правила слотов

1. Берётся рабочий интервал барбера на этот день недели (`WorkSchedule`).
2. Применяются исключения (`ScheduleException`): выходной → пусто, override часов → сужаем интервал.
3. Вычитаются все **confirmed**-записи барбера на этот день.
4. Слоты идут по сетке с шагом **30 минут**, услуга должна влезать целиком (`start + duration <= workEnd`).
5. Учитывается **минимальный зазор** до «сейчас»:
   - на сайте — 15 минут (`MIN_LEAD_MINUTES_WEB`),
   - в боте — 60 минут (`MIN_LEAD_MINUTES_BOT`).
6. Защита от двойной записи — **на уровне БД**: уникальный индекс `(barberId, startsAt)` в таблице `Booking`.

## Архитектурные решения

- **Shared booking lib** — `lib/booking/` содержит всю логику слотов и создания записи. И сайт (через `app/api/*`), и бот (`bot/`) импортируют одни и те же функции. Правила не могут разъехаться.
- **Слои в API** — каждый роут проходит через `lib/api/http.ts` (ответы), `lib/api/validators.ts` (валидация), `lib/api/serializers.ts` (DTO). Бизнес-логика — в `lib/booking/`.
- **Ошибки как данные** — функции возвращают `{ ok: true, ... } | { ok: false, error, code }`. Никаких `throw` для контроля потока.
- **Двухуровневая защита от гонки** — сначала логическая проверка (пересчёт слотов), затем ловля `P2002` от БД на уникальном индексе.
- **Local-time, не UTC** — все даты и время считаются в локальном часовом поясе сервера, чтобы сетка слотов совпадала с тем, что видит пользователь.

## Скрипты

| Команда | Что делает |
|---|---|
| `npm run dev` | Запуск Next.js в dev-режиме |
| `npm run build` | Production-сборка Next.js |
| `npm run start` | Запуск собранного Next.js |
| `npm run bot` | Запуск Telegram-бота через `tsx` |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | `prisma db seed` |
| `npm run db:studio` | Открыть Prisma Studio для просмотра БД |
| `npm run db:reset` | Сбросить БД и накатить миграции + seed |
| `npm run lint` | ESLint |

## Команды бота

| Команда | Что делает |
|---|---|
| `/start` | Начать запись |
| `/my` | Мои активные записи (с кнопками отмены) |
| `/cancel` | Сбросить текущий диалог |
| `/help` | Список команд |

## Технические заметки

- **SQLite** — данные лежат в `prisma/dev.db`. Файл не коммитится.
- **Prisma-клиент** — singleton в `lib/prisma.ts`, чтобы dev-режим Next.js не плодил подключения.
- **Auth** — HMAC-SHA256 cookie, секрет = `ADMIN_PASSWORD`. Сравнение токенов через `timingSafeEqual`.
- **Валидация телефона** — узбекский формат `+998XXXXXXXXX`. Функция `normalizePhone` приводит любые форматы (`90 123 45 67`, `+998 90 ...`, `8 90 ...`) к единому виду.
- **Валюта** — сум, константа `CURRENCY` в `lib/constants.ts`. Форматирование через `toLocaleString("ru-RU")`.

## Вне скоупа первой версии

Онлайн-оплата, SMS-напоминания, multi-tenant, мобильное приложение.