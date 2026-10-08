import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSubtaskDto,
  CreateTaskDto,
  ReorderTasksDto,
  STATUSES,
  UpdateSubtaskDto,
  UpdateTaskDto,
} from './dto/tasks.dto';
import { toSubtaskDto, toTaskDto } from './tasks.mapper';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, status?: string) {
    const where: Prisma.TaskWhereInput = { userId, deletedAt: null };
    if (status !== undefined) {
      if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
        throw new BadRequestException('Unknown status');
      }
      where.status = status as TaskStatus;
    }

    const tasks = await this.prisma.task.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return tasks.map(toTaskDto);
  }

  async findOne(userId: string, id: string) {
    const task = await this.requireOwnTask(userId, id);
    return toTaskDto(task);
  }

  async create(userId: string, dto: CreateTaskDto) {
    if (dto.categoryId) {
      await this.requireOwnCategory(userId, dto.categoryId);
    }

    const maxOrder = await this.prisma.task.aggregate({
      where: { userId },
      _max: { sortOrder: true },
    });

    const task = await this.prisma.task.create({
      data: {
        userId,
        title: this.requiredTitle(dto.title),
        description: dto.description?.trim() ?? '',
        priority: dto.priority ?? 'medium',
        status: dto.status ?? 'todo',
        dueDate: this.parseDueDate(dto.dueDate),
        dueTime: dto.dueTime || null,
        estimatedMinutes: dto.estimatedMinutes ?? null,
        categoryId: dto.categoryId ?? null,
        sortOrder: dto.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
        completedAt: (dto.status ?? 'todo') === 'done' ? new Date() : null,
      },
    });

    return toTaskDto(task);
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    const current = await this.requireOwnTask(userId, id);
    if (dto.categoryId) {
      await this.requireOwnCategory(userId, dto.categoryId);
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title !== undefined
          ? { title: this.requiredTitle(dto.title) }
          : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() }
          : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.dueDate !== undefined
          ? { dueDate: this.parseDueDate(dto.dueDate) }
          : {}),
        ...(dto.dueTime !== undefined ? { dueTime: dto.dueTime || null } : {}),
        ...(dto.estimatedMinutes !== undefined
          ? { estimatedMinutes: dto.estimatedMinutes }
          : {}),
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...this.completionStamp(current.status, dto.status),
      },
    });

    return toTaskDto(task);
  }

  async toggle(userId: string, id: string) {
    const current = await this.requireOwnTask(userId, id);
    return this.update(userId, id, {
      status: current.status === 'done' ? 'todo' : 'done',
    });
  }

  async remove(userId: string, id: string) {
    await this.requireOwnTask(userId, id);
    await this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { ok: true };
  }

  async restore(userId: string, id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        subtasks: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      },
    });
    if (!task || task.userId !== userId || !task.deletedAt) {
      throw new NotFoundException('Task not found');
    }

    const restored = await this.prisma.task.update({
      where: { id },
      data: { deletedAt: null },
      include: {
        subtasks: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      },
    });

    return {
      task: toTaskDto(restored),
      subtasks: restored.subtasks.map(toSubtaskDto),
    };
  }

  async reorder(userId: string, dto: ReorderTasksDto) {
    const ids = dto.items.map((item) => item.id);
    const owned = await this.prisma.task.findMany({
      where: { userId, id: { in: ids }, deletedAt: null },
      select: { id: true },
    });
    if (owned.length !== ids.length) {
      throw new ForbiddenException('One or more tasks do not belong to you');
    }

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.task.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    return this.findAll(userId);
  }

  async listSubtasks(userId: string) {
    const rows = await this.prisma.subtask.findMany({
      where: { userId, task: { deletedAt: null } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(toSubtaskDto);
  }

  async addSubtask(userId: string, taskId: string, dto: CreateSubtaskDto) {
    await this.requireOwnTask(userId, taskId);
    const maxOrder = await this.prisma.subtask.aggregate({
      where: { taskId },
      _max: { sortOrder: true },
    });
    const subtask = await this.prisma.subtask.create({
      data: {
        userId,
        taskId,
        title: this.requiredTitle(dto.title),
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });
    return toSubtaskDto(subtask);
  }

  async updateSubtask(userId: string, id: string, dto: UpdateSubtaskDto) {
    const existing = await this.prisma.subtask.findUnique({
      where: { id },
      include: { task: true },
    });
    if (!existing || existing.userId !== userId || existing.task.deletedAt) {
      throw new NotFoundException('Subtask not found');
    }
    const subtask = await this.prisma.subtask.update({
      where: { id },
      data: {
        ...(dto.title !== undefined
          ? { title: this.requiredTitle(dto.title) }
          : {}),
        ...(dto.completed !== undefined ? { completed: dto.completed } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });
    return toSubtaskDto(subtask);
  }

  async removeSubtask(userId: string, id: string) {
    const existing = await this.prisma.subtask.findUnique({
      where: { id },
      include: { task: true },
    });
    if (!existing || existing.userId !== userId || existing.task.deletedAt) {
      throw new NotFoundException('Subtask not found');
    }
    await this.prisma.subtask.delete({ where: { id } });
    return { ok: true };
  }

  private async requireOwnTask(userId: string, id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task || task.userId !== userId || task.deletedAt) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  private async requireOwnCategory(userId: string, categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category || category.userId !== userId) {
      throw new NotFoundException('Category not found');
    }
  }

  private requiredTitle(value: string): string {
    const title = typeof value === 'string' ? value.trim() : '';
    if (!title) throw new BadRequestException('Title must not be empty');
    return title;
  }

  /** Sets the stamp only when status enters done, and clears it when status leaves done. */
  private completionStamp(
    current: TaskStatus,
    next: TaskStatus | undefined,
  ): { completedAt?: Date | null } {
    if (next === undefined || next === current) return {};
    if (next === 'done') return { completedAt: new Date() };
    return { completedAt: null };
  }

  private parseDueDate(value: string): Date {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      throw new BadRequestException('dueDate must be YYYY-MM-DD');
    }
    return date;
  }
}
