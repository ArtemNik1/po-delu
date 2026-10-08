/// <reference types="jest" />
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request, { type Response } from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

interface AuthBody {
  accessToken: string;
  user: { email: string; passwordHash?: string };
}

interface MeBody {
  id: string;
  email: string;
  passwordHash?: string;
}

interface CategoryBody {
  id: string;
  name: string;
  user_id: string;
}

interface TaskBody {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  userId: string;
  categoryId: string | null;
  dueTime: string | null;
  estimatedMinutes: number | null;
  sortOrder: number;
  completedAt: string | null;
  createdAt: string;
  completed?: boolean;
}

interface ErrorBody {
  message: string | string[];
}

interface HealthBody {
  status: string;
}

/** Reads a JSON body without treating supertest's `any` as a typed value. */
function readJson<T>(response: Response): T {
  const payload = (response as { body: unknown }).body;
  return payload as T;
}

async function assertDatabaseReachable(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Start: docker compose up -d db && npm run prisma:migrate --prefix backend',
    );
  }

  const client = new PrismaClient();
  try {
    await client.$connect();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `PostgreSQL is unreachable at DATABASE_URL. Start: docker compose up -d db && npm run prisma:migrate --prefix backend. Cause: ${reason}`,
      { cause: error },
    );
  } finally {
    await client.$disconnect();
  }
}

describe('Auth and Tasks API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let tokenA = '';
  let tokenB = '';
  let taskId = '';
  let categoryId = '';
  const stamp = Date.now();
  const emailA = `alice.${stamp}@example.com`;
  const emailB = `bob.${stamp}@example.com`;

  beforeAll(async () => {
    await assertDatabaseReachable();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  }, 60_000);

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({
        where: { email: { in: [emailA, emailB] } },
      });
      await prisma.$disconnect();
    }
    if (app) await app.close();
  });

  it('registers a user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: emailA, password: 'password123', displayName: 'Alice' })
      .expect(201);

    const registered = readJson<AuthBody>(res);
    expect(registered.accessToken).toBeDefined();
    expect(registered.user.email).toBe(emailA);
    expect(registered.user.passwordHash).toBeUndefined();
    expect(JSON.stringify(registered)).not.toContain('passwordHash');
    tokenA = registered.accessToken;

    const stored = await prisma.user.findUnique({ where: { email: emailA } });
    expect(stored?.passwordHash).toBeDefined();
    expect(stored?.passwordHash).not.toBe('password123');
    expect(await bcrypt.compare('password123', stored!.passwordHash)).toBe(
      true,
    );
  });

  it('rejects duplicate email registration', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: emailA, password: 'password123' })
      .expect(409);
  });

  it('logs in', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: emailA, password: 'password123' })
      .expect(200);

    const loggedIn = readJson<AuthBody>(res);
    expect(loggedIn.accessToken).toBeDefined();
    expect(JSON.stringify(loggedIn)).not.toContain('passwordHash');
    tokenA = loggedIn.accessToken;
  });

  it('rejects wrong password with 401', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: emailA, password: 'wrong-password' })
      .expect(401);
  });

  it('rejects /auth/me without JWT', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('returns /auth/me with JWT', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const me = readJson<MeBody>(res);
    expect(me.email).toBe(emailA);
    expect(me.passwordHash).toBeUndefined();
    expect(JSON.stringify(me)).not.toContain('passwordHash');
  });

  it('creates a category', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Work', icon: 'briefcase' })
      .expect(201);

    const category = readJson<CategoryBody>(res);
    expect(category.name).toBe('Work');
    expect(category.user_id).toBeDefined();
    categoryId = category.id;
  });

  it('lists categories', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/categories')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(
      readJson<CategoryBody[]>(res).some((item) => item.id === categoryId),
    ).toBe(true);
  });

  it('rejects protected routes without JWT', async () => {
    await request(app.getHttpServer()).get('/api/tasks').expect(401);
    await request(app.getHttpServer())
      .get(`/api/tasks/${crypto.randomUUID()}`)
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/tasks')
      .send({ title: 'Nope', dueDate: '2026-09-30' })
      .expect(401);
    await request(app.getHttpServer())
      .patch(`/api/tasks/${crypto.randomUUID()}`)
      .send({ status: 'done' })
      .expect(401);
    await request(app.getHttpServer())
      .delete(`/api/tasks/${crypto.randomUUID()}`)
      .expect(401);
  });

  it('creates a task from the spec fields', async () => {
    const me = readJson<MeBody>(
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200),
    );

    const rejected = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Exam task',
        description: 'Notes',
        priority: 'high',
        status: 'todo',
        dueDate: '2026-09-26',
        categoryId,
        userId: '00000000-0000-0000-0000-000000000000',
      })
      .expect(400);

    expect(readJson<ErrorBody>(rejected).message).toBeDefined();

    const created = readJson<TaskBody>(
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Exam task',
          description: 'Notes',
          priority: 'high',
          status: 'todo',
          dueDate: '2026-09-26',
          categoryId,
        })
        .expect(201),
    );

    expect(created.title).toBe('Exam task');
    expect(created.description).toBe('Notes');
    expect(created.status).toBe('todo');
    expect(created.priority).toBe('high');
    expect(created.dueDate).toBe('2026-09-26');
    expect(created.userId).toBe(me.id);
    expect(created.categoryId).toBe(categoryId);
    expect(created.completedAt).toBeNull();
    expect(created.completed).toBeUndefined();
    expect(JSON.stringify(created)).not.toContain('passwordHash');
    taskId = created.id;
  });

  it('gets a task by id', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const task = readJson<TaskBody>(res);
    expect(task.id).toBe(taskId);
    expect(task.title).toBe('Exam task');
  });

  it('lists tasks', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const tasks = readJson<TaskBody[]>(res);
    expect(tasks.some((task) => task.id === taskId)).toBe(true);
  });

  it('updates a task', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Updated exam task', description: 'Notes' })
      .expect(200);

    const task = readJson<TaskBody>(res);
    expect(task.title).toBe('Updated exam task');
    expect(task.description).toBe('Notes');
  });

  it('updates status and priority', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'in_progress', priority: 'low' })
      .expect(200);

    const task = readJson<TaskBody>(res);
    expect(task.status).toBe('in_progress');
    expect(task.priority).toBe('low');
    expect(task.completedAt).toBeNull();
    expect(task.completed).toBeUndefined();
  });

  it('stamps completedAt only when status becomes done', async () => {
    const created = readJson<TaskBody>(
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Completion stamp',
          dueDate: '2026-09-20',
          status: 'todo',
        })
        .expect(201),
    );
    expect(created.completedAt).toBeNull();

    const done = readJson<TaskBody>(
      await request(app.getHttpServer())
        .patch(`/api/tasks/${created.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'done' })
        .expect(200),
    );
    expect(done.status).toBe('done');
    expect(done.completedAt).toEqual(expect.any(String));
    const firstStamp = done.completedAt;

    const edited = readJson<TaskBody>(
      await request(app.getHttpServer())
        .patch(`/api/tasks/${created.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Edited while done',
          description: 'Still done',
          priority: 'high',
          dueDate: '2026-10-01',
        })
        .expect(200),
    );
    expect(edited.title).toBe('Edited while done');
    expect(edited.status).toBe('done');
    expect(edited.completedAt).toBe(firstStamp);

    const repeated = readJson<TaskBody>(
      await request(app.getHttpServer())
        .patch(`/api/tasks/${created.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'done' })
        .expect(200),
    );
    expect(repeated.completedAt).toBe(firstStamp);

    const reopened = readJson<TaskBody>(
      await request(app.getHttpServer())
        .patch(`/api/tasks/${created.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'todo' })
        .expect(200),
    );
    expect(reopened.completedAt).toBeNull();

    const paused = readJson<TaskBody>(
      await request(app.getHttpServer())
        .patch(`/api/tasks/${created.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'done' })
        .expect(200),
    );
    const secondStamp = paused.completedAt;
    expect(secondStamp).toEqual(expect.any(String));
    expect(secondStamp).not.toBe(firstStamp);

    const cleared = readJson<TaskBody>(
      await request(app.getHttpServer())
        .patch(`/api/tasks/${created.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'in_progress' })
        .expect(200),
    );
    expect(cleared.completedAt).toBeNull();

    await request(app.getHttpServer())
      .patch(`/api/tasks/${created.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ completedAt: '2000-01-01T00:00:00.000Z' })
      .expect(400);

    const unchanged = readJson<TaskBody>(
      await request(app.getHttpServer())
        .get(`/api/tasks/${created.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200),
    );
    expect(unchanged.completedAt).toBeNull();
    expect(unchanged.status).toBe('in_progress');

    await request(app.getHttpServer())
      .delete(`/api/tasks/${created.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
  });

  it('rejects unknown status and priority', async () => {
    await request(app.getHttpServer())
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'planned' })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ priority: 'critical' })
      .expect(400);

    await request(app.getHttpServer())
      .get('/api/tasks')
      .query({ status: 'inbox' })
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(400);
  });

  it('reorders tasks', async () => {
    const second = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Second task', dueDate: '2026-09-27', status: 'done' })
      .expect(201);

    const secondId = readJson<TaskBody>(second).id;
    const res = await request(app.getHttpServer())
      .patch('/api/tasks/reorder')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        items: [
          { id: secondId, sortOrder: 1 },
          { id: taskId, sortOrder: 2 },
        ],
      })
      .expect(200);

    const ordered = readJson<TaskBody[]>(res);
    const byId = new Map(ordered.map((task) => [task.id, task.sortOrder]));
    expect(byId.get(secondId)).toBe(1);
    expect(byId.get(taskId)).toBe(2);

    await request(app.getHttpServer())
      .delete(`/api/tasks/${secondId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
  });

  it('filters tasks by each status and hides foreign tasks', async () => {
    await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Still todo', dueDate: '2026-09-28', status: 'todo' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Finished', dueDate: '2026-09-29', status: 'done' })
      .expect(201);

    const all = readJson<TaskBody[]>(
      await request(app.getHttpServer())
        .get('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200),
    );
    expect(all.map((task) => task.id)).toContain(taskId);

    for (const status of ['todo', 'in_progress', 'done'] as const) {
      const filtered = readJson<TaskBody[]>(
        await request(app.getHttpServer())
          .get('/api/tasks')
          .query({ status })
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(200),
      );
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((task) => task.status === status)).toBe(true);
    }

    const register = readJson<AuthBody>(
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: emailB, password: 'password123' })
        .expect(201),
    );
    tokenB = register.accessToken;

    const foreignAll = readJson<TaskBody[]>(
      await request(app.getHttpServer())
        .get('/api/tasks')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200),
    );
    expect(foreignAll).toEqual([]);

    for (const status of ['todo', 'in_progress', 'done']) {
      const foreign = readJson<TaskBody[]>(
        await request(app.getHttpServer())
          .get('/api/tasks')
          .query({ status })
          .set('Authorization', `Bearer ${tokenB}`)
          .expect(200),
      );
      expect(foreign.every((task) => task.id !== taskId)).toBe(true);
      expect(foreign).toEqual([]);
    }
  });

  it('prevents another user from accessing a foreign task', async () => {
    const list = readJson<TaskBody[]>(
      await request(app.getHttpServer())
        .get('/api/tasks')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200),
    );
    expect(list.every((task) => task.id !== taskId)).toBe(true);

    await request(app.getHttpServer())
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Hacked' })
      .expect(404);

    await request(app.getHttpServer())
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });

  it('updates and deletes a category', async () => {
    const updated = await request(app.getHttpServer())
      .patch(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Deep Work' })
      .expect(200);
    expect(readJson<CategoryBody>(updated).name).toBe('Deep Work');

    await request(app.getHttpServer())
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
  });

  it('rejects blank titles and nulls without changing the saved task', async () => {
    const before = readJson<TaskBody[]>(
      await request(app.getHttpServer())
        .get('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200),
    );

    await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: '   ', dueDate: '2026-09-30' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Blank fields', dueDate: '2026-09-30', description: null })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Blank fields', dueDate: '2026-09-30', status: null })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Blank fields', dueDate: '2026-09-30', priority: null })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Blank fields', dueDate: null })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Blank fields', dueDate: '2026-09-30', sortOrder: null })
      .expect(400);

    const afterRejectedCreate = readJson<TaskBody[]>(
      await request(app.getHttpServer())
        .get('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200),
    );
    expect(afterRejectedCreate).toHaveLength(before.length);

    const created = readJson<TaskBody>(
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: '  Kept title  ',
          description: 'Notes',
          priority: 'high',
          status: 'todo',
          dueDate: '2026-09-30',
          dueTime: '09:30',
          estimatedMinutes: 25,
        })
        .expect(201),
    );
    expect(created.title).toBe('Kept title');

    const invalidPatches = [
      { title: '   ' },
      { title: null },
      { description: null },
      { status: null },
      { priority: null },
      { dueDate: null },
      { sortOrder: null },
    ];
    for (const patch of invalidPatches) {
      await request(app.getHttpServer())
        .patch(`/api/tasks/${created.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send(patch)
        .expect(400);
    }

    const unchanged = readJson<TaskBody>(
      await request(app.getHttpServer())
        .get(`/api/tasks/${created.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200),
    );
    expect(unchanged.title).toBe('Kept title');
    expect(unchanged.description).toBe('Notes');
    expect(unchanged.status).toBe('todo');
    expect(unchanged.priority).toBe('high');
    expect(unchanged.dueDate).toBe('2026-09-30');

    const cleared = readJson<TaskBody>(
      await request(app.getHttpServer())
        .patch(`/api/tasks/${created.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ dueTime: null, estimatedMinutes: null, categoryId: null })
        .expect(200),
    );
    expect(cleared.dueTime).toBeNull();
    expect(cleared.estimatedMinutes).toBeNull();
    expect(cleared.categoryId).toBeNull();
    expect(cleared.title).toBe('Kept title');

    await request(app.getHttpServer())
      .post(`/api/tasks/${created.id}/subtasks`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: '   ' })
      .expect(400);

    const subtask = readJson<{ id: string; title: string }>(
      await request(app.getHttpServer())
        .post(`/api/tasks/${created.id}/subtasks`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: '  Step  ' })
        .expect(201),
    );
    expect(subtask.title).toBe('Step');

    await request(app.getHttpServer())
      .patch(`/api/tasks/subtasks/${subtask.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: '   ' })
      .expect(400);
    await request(app.getHttpServer())
      .patch(`/api/tasks/subtasks/${subtask.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: null })
      .expect(400);

    await request(app.getHttpServer())
      .delete(`/api/tasks/${created.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
  });

  it('rejects null required fields, blank names and invalid times', async () => {
    const auth = { Authorization: `Bearer ${tokenA}` };

    for (const body of [
      { theme: null },
      { dailyGoal: null },
      { weekStartsOn: null },
      { soundEnabled: null },
      { onboardingCompleted: null },
    ]) {
      await request(app.getHttpServer())
        .patch('/api/users/me/settings')
        .set(auth)
        .send(body)
        .expect(400);
    }

    const clearedLanguage = readJson<{
      settings: { language: string | null; week_starts_on: number };
    }>(
      await request(app.getHttpServer())
        .patch('/api/users/me/settings')
        .set(auth)
        .send({ language: null, weekStartsOn: 0 })
        .expect(200),
    );
    expect(clearedLanguage.settings.language).toBeNull();
    expect(clearedLanguage.settings.week_starts_on).toBe(1);

    await request(app.getHttpServer())
      .post('/api/categories')
      .set(auth)
      .send({ name: '   ' })
      .expect(400);

    const category = readJson<{ id: string; name: string }>(
      await request(app.getHttpServer())
        .post('/api/categories')
        .set(auth)
        .send({ name: '  Focus  ' })
        .expect(201),
    );
    expect(category.name).toBe('Focus');

    await request(app.getHttpServer())
      .patch(`/api/categories/${category.id}`)
      .set(auth)
      .send({ name: null })
      .expect(400);
    await request(app.getHttpServer())
      .patch(`/api/categories/${category.id}`)
      .set(auth)
      .send({ icon: null })
      .expect(400);

    const created = readJson<TaskBody>(
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set(auth)
        .send({ title: 'Validate me', dueDate: '2026-10-11', status: 'done' })
        .expect(201),
    );
    const createdAt = created.createdAt;
    const completedAt = created.completedAt;
    expect(completedAt).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .patch(`/api/tasks/${created.id}`)
      .set(auth)
      .send({ dueTime: 'abc' })
      .expect(400);
    await request(app.getHttpServer())
      .patch(`/api/tasks/${created.id}`)
      .set(auth)
      .send({ dueTime: '25:99' })
      .expect(400);

    const timed = readJson<TaskBody>(
      await request(app.getHttpServer())
        .patch(`/api/tasks/${created.id}`)
        .set(auth)
        .send({ dueTime: '09:30' })
        .expect(200),
    );
    expect(timed.dueTime).toBe('09:30');

    const clearedTime = readJson<TaskBody>(
      await request(app.getHttpServer())
        .patch(`/api/tasks/${created.id}`)
        .set(auth)
        .send({ dueTime: null, estimatedMinutes: null, categoryId: null })
        .expect(200),
    );
    expect(clearedTime.dueTime).toBeNull();
    expect(clearedTime.estimatedMinutes).toBeNull();

    await request(app.getHttpServer())
      .patch('/api/tasks/reorder')
      .set(auth)
      .send({ items: [{ id: created.id, sortOrder: 3_000_000_000 }] })
      .expect(400);
    await request(app.getHttpServer())
      .patch('/api/tasks/reorder')
      .set(auth)
      .send({ items: [{ id: created.id, sortOrder: 4 }] })
      .expect(200);

    const subtask = readJson<{ id: string }>(
      await request(app.getHttpServer())
        .post(`/api/tasks/${created.id}/subtasks`)
        .set(auth)
        .send({ title: 'Keep me' })
        .expect(201),
    );
    await request(app.getHttpServer())
      .patch(`/api/tasks/subtasks/${subtask.id}`)
      .set(auth)
      .send({ completed: null })
      .expect(400);
    await request(app.getHttpServer())
      .patch(`/api/tasks/subtasks/${subtask.id}`)
      .set(auth)
      .send({ completed: true })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/api/tasks/${created.id}`)
      .set(auth)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/api/tasks/${created.id}`)
      .set(auth)
      .expect(404);

    const listed = readJson<TaskBody[]>(
      await request(app.getHttpServer())
        .get('/api/tasks')
        .set(auth)
        .expect(200),
    );
    expect(listed.some((item) => item.id === created.id)).toBe(false);

    const restored = readJson<{
      task: TaskBody;
      subtasks: { id: string; completed: boolean }[];
    }>(
      await request(app.getHttpServer())
        .post(`/api/tasks/${created.id}/restore`)
        .set(auth)
        .expect(201),
    );
    expect(restored.task.id).toBe(created.id);
    expect(restored.task.createdAt).toBe(createdAt);
    expect(restored.task.completedAt).toBe(completedAt);
    expect(restored.task.status).toBe('done');
    expect(restored.subtasks).toEqual([
      expect.objectContaining({ id: subtask.id, completed: true }),
    ]);
  });

  it('deletes a task', async () => {
    await request(app.getHttpServer())
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(404);
  });

  it('health endpoint works', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);
    expect(readJson<HealthBody>(res).status).toBe('ok');
  });
});
