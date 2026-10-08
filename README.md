# По делу

Персональный трекер задач с приоритетами. Статусы: к выполнению, в работе, выполнено. Приоритеты: низкий, средний, высокий. Список фильтруется на сервере по `?status=`. Неделя начинается с понедельника. Удалённую задачу можно вернуть вместе с датами и подзадачами.

```text
frontend/  React + TypeScript + Vite + Axios + Zustand
backend/   NestJS + Prisma + PostgreSQL + JWT
```

## Запуск

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

npm run install:all
docker compose up --build
npm run dev:frontend
```

Frontend: http://localhost:5173  
API: http://localhost:3000/api  
Swagger: http://localhost:3000/api/docs

Корневой `.env` нужен только Docker Compose (`JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`).  
`VITE_API_URL` читает Vite из `frontend/.env`.

## Проверка

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```

## Деплой

Frontend — GitHub Pages (`HashRouter`, workflow `.github/workflows/deploy.yml`).  
Backend и PostgreSQL — отдельный сервер через Docker Compose.  
Для Pages задайте GitHub variable `VITE_API_URL`.
