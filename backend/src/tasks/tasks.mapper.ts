import { Subtask, Task } from '@prisma/client';

/** Calendar date stored as PostgreSQL DATE. UTC midnight round-trips without a day shift. */
export function formatDueDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function toTaskDto(task: Task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: formatDueDate(task.dueDate),
    userId: task.userId,
    dueTime: task.dueTime,
    estimatedMinutes: task.estimatedMinutes,
    categoryId: task.categoryId,
    sortOrder: task.sortOrder,
    completedAt: task.completedAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export function toSubtaskDto(subtask: Subtask) {
  return {
    id: subtask.id,
    task_id: subtask.taskId,
    user_id: subtask.userId,
    title: subtask.title,
    completed: subtask.completed,
    sort_order: subtask.sortOrder,
    created_at: subtask.createdAt.toISOString(),
  };
}
