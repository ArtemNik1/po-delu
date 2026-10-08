import type { Category, Status, Subtask, Task, TaskInsert, TaskPatch } from '../types/database'
import { api } from './api'

export const tasksApi = {
  list(status?: Status) {
    return api
      .get<Task[]>('/tasks', { params: status ? { status } : undefined })
      .then((res) => res.data)
  },

  create(payload: TaskInsert) {
    return api
      .post<Task>('/tasks', {
        title: payload.title,
        description: payload.description,
        priority: payload.priority,
        status: payload.status ?? 'todo',
        dueDate: payload.dueDate,
        dueTime: payload.dueTime,
        estimatedMinutes: payload.estimatedMinutes,
        categoryId: payload.categoryId,
        sortOrder: payload.sortOrder,
      })
      .then((res) => res.data)
  },

  update(id: string, patch: TaskPatch) {
    return api
      .patch<Task>(`/tasks/${id}`, {
        title: patch.title,
        description: patch.description,
        priority: patch.priority,
        status: patch.status,
        dueDate: patch.dueDate,
        dueTime: patch.dueTime,
        estimatedMinutes: patch.estimatedMinutes,
        categoryId: patch.categoryId,
        sortOrder: patch.sortOrder,
      })
      .then((res) => res.data)
  },

  remove(id: string) {
    return api.delete(`/tasks/${id}`).then((res) => res.data)
  },

  restore(id: string) {
    return api.post<{ task: Task; subtasks: Subtask[] }>(`/tasks/${id}/restore`).then((res) => res.data)
  },

  reorder(items: { id: string; sortOrder: number }[]) {
    return api.patch<Task[]>('/tasks/reorder', { items }).then((res) => res.data)
  },

  listSubtasks() {
    return api.get<Subtask[]>('/tasks/subtasks/all').then((res) => res.data)
  },

  addSubtask(taskId: string, title: string) {
    return api.post<Subtask>(`/tasks/${taskId}/subtasks`, { title }).then((res) => res.data)
  },

  updateSubtask(id: string, patch: Partial<Pick<Subtask, 'title' | 'completed' | 'sort_order'>>) {
    return api
      .patch<Subtask>(`/tasks/subtasks/${id}`, {
        title: patch.title,
        completed: patch.completed,
        sortOrder: patch.sort_order,
      })
      .then((res) => res.data)
  },

  removeSubtask(id: string) {
    return api.delete(`/tasks/subtasks/${id}`).then((res) => res.data)
  },
}

export const categoriesApi = {
  list() {
    return api.get<Category[]>('/categories').then((res) => res.data)
  },

  create(name: string, icon: string) {
    return api.post<Category>('/categories', { name, icon }).then((res) => res.data)
  },

  remove(id: string) {
    return api.delete(`/categories/${id}`).then((res) => res.data)
  },
}
