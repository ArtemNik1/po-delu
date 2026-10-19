# По делу API

API трекера задач на NestJS, Prisma и PostgreSQL. Авторизация через JWT, задачи и категории привязаны к пользователю.

Полный запуск с базой описан в [README проекта](../README.md). Для работы отдельно от Docker скопируй `.env.example` в `.env` и укажи адрес PostgreSQL и `JWT_SECRET`.

```bash
npm ci
npm run prisma:migrate
npm run start:dev
```

Проверка:

```bash
npm test
npm run test:e2e
npm run build
```

Для e2e-тестов используй отдельную PostgreSQL. Документация запущенного API: http://localhost:3000/api/docs.
