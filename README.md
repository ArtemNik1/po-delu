# По делу

Личный трекер задач. Можно планировать день, задавать приоритеты, добавлять подзадачи и категории, следить за выполнением и работать с таймером фокуса. Есть русский и английский интерфейс.

Frontend написан на React и TypeScript, использует Vite, Zustand и Axios. Backend - NestJS, Prisma и PostgreSQL; авторизация работает через JWT.

## Запуск

Нужны Node.js 22.12+ и Docker Compose. Из корня проекта:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Задай свой `JWT_SECRET` в `.env` и `backend/.env`, затем выполни:

```bash
npm run install:all
docker compose up --build -d
npm run dev:frontend
```

- Приложение: http://localhost:5173
- API: http://localhost:3000/api
- Swagger: http://localhost:3000/api/docs

Docker поднимает базу и backend. Frontend запускается отдельно через Vite. Адрес API задаётся переменной `VITE_API_URL` в `frontend/.env`.

## Проверка

```bash
npm run typecheck
npm run lint
npm test
npm test --prefix backend
npm run build
```

Для e2e-тестов нужна доступная PostgreSQL и применённые миграции:

```bash
npm run prisma:migrate --prefix backend
npm run test:e2e
```

Используй отдельную тестовую базу: e2e-тесты создают пользователей и задачи, а после проверки удаляют свои данные.

## Структура

- `frontend/` - интерфейс, состояние приложения и клиент API.
- `backend/src/` - авторизация, пользователи, задачи и категории.
- `backend/prisma/` - схема базы и миграции.
- `docker-compose.yml` - локальная база и backend.

## Публикация

Frontend можно разместить на статическом хостинге, в том числе на GitHub Pages. Для него нужен адрес опубликованного API в `VITE_API_URL`. Backend и PostgreSQL размещаются отдельно; допустимый адрес сайта задаётся через `CORS_ORIGIN`.
