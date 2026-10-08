import type { DraggableAttributes } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { CalendarArrowUp, GripVertical, Pencil, Timer, Trash2 } from 'lucide-react'
import { memo, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCategory, useSubtasksOf } from '../../hooks/useTasks'
import { useTaskActions } from '../../hooks/useTaskActions'
import { useTranslation } from '../../hooks/useTranslation'
import { STATUS_KEY, STATUS_MARK, withMark } from '../../lib/constants'
import { cn } from '../../lib/cn'
import { translate } from '../../lib/i18n'
import { useUiStore } from '../../store/uiStore'
import type { Status, Task } from '../../types/database'
import { isDone } from '../../utils/tasks'
import { durationLabel, formatTime, relativeDateLabel } from '../../utils/dates'
import { subtaskProgress } from '../../utils/tasks'
import { IconButton } from '../ui/Button'
import { CategoryGlyph } from '../ui/CategoryGlyph'
import { Checkbox } from '../ui/Checkbox'
import { PriorityMark } from '../ui/PriorityBadge'

interface DragBindings {
  ref: (element: HTMLElement | null) => void
  style: CSSProperties
  attributes: DraggableAttributes
  handle: ReactNode
  isDragging: boolean
}

interface TaskRowProps {
  task: Task
  showDate?: boolean
}

/** Static row, used wherever the order is derived rather than user-controlled. */
export const TaskRow = memo(function TaskRow({ task, showDate }: TaskRowProps) {
  return <Row task={task} showDate={showDate} />
})

/**
 * Draggable row. Kept separate so `useSortable` is only ever called inside a
 * `SortableContext`.
 */
export const SortableTaskRow = memo(function SortableTaskRow({ task, showDate }: TaskRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  return (
    <Row
      task={task}
      showDate={showDate}
      drag={{
        ref: setNodeRef,
        style: { transform: CSS.Translate.toString(transform), transition },
        attributes,
        isDragging,
        handle: (
          <button
            type="button"
            aria-label={translate('task.reorder', { title: task.title })}
            className="mt-1 hidden cursor-grab touch-none text-faint opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing md:block"
            {...listeners}
          >
            <GripVertical className="h-4 w-4" aria-hidden />
          </button>
        ),
      }}
    />
  )
})

function Row({ task, showDate = false, drag }: TaskRowProps & { drag?: DragBindings }) {
  const subtasks = useSubtasksOf(task.id)
  const category = useCategory(task.categoryId)
  const selected = useUiStore((state) => state.selectedTaskId === task.id)
  const selectTask = useUiStore((state) => state.selectTask)
  const { setCompleted, setStatus, moveToTomorrow, confirmRemove } = useTaskActions()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const done = isDone(task)

  const progress = subtaskProgress(subtasks)
  const duration = durationLabel(task.estimatedMinutes)
  const time = formatTime(task.dueTime)

  return (
    <motion.li
      layout="position"
      ref={drag?.ref}
      style={drag?.style}
      initial={false}
      exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'group relative list-none overflow-hidden rounded-2xl border transition duration-150',
        selected
          ? 'border-line-strong bg-elevated'
          : 'border-transparent bg-elevated/40 hover:border-line hover:bg-elevated',
        drag?.isDragging && 'z-10 border-accent/40 shadow-2xl',
        done && 'opacity-55',
      )}
      {...drag?.attributes}
    >
      <div className="flex items-start gap-3 px-3 py-3">
        {drag?.handle}

        <div className="mt-0.5">
          <Checkbox
            checked={done}
            label={task.title}
            onChange={(value) => void setCompleted(task, value)}
          />
        </div>

        <button
          type="button"
          onClick={() => selectTask(task.id)}
          className="min-w-0 flex-1 text-left"
          aria-label={t('task.openDetails', { title: task.title })}
        >
          <span className="flex items-center gap-2">
            <PriorityMark priority={task.priority} compact />
            <span
              className={cn(
                'truncate text-sm font-medium transition',
                done && 'text-muted line-through decoration-1',
              )}
            >
              {task.title}
            </span>
          </span>

          <span className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-faint">
            {category ? (
              <span className="inline-flex items-center gap-1">
                <CategoryGlyph icon={category.icon} className="h-3 w-3" />
                {category.name}
              </span>
            ) : null}
            {showDate ? <span>{relativeDateLabel(task.dueDate)}</span> : null}
            {time ? <span>{time}</span> : null}
            {duration ? (
              <span className="inline-flex items-center gap-1">
                <Timer className="h-3 w-3" aria-hidden />
                {duration}
              </span>
            ) : null}
            {progress.total > 0 ? (
              <span className={cn(progress.done === progress.total && 'text-accent')}>
                {t('task.subtaskProgress', { done: progress.done, total: progress.total })}
              </span>
            ) : null}
          </span>
        </button>

        <select
          aria-label={t('task.status')}
          value={task.status}
          onChange={(event) => void setStatus(task, event.target.value as Status)}
          className="mt-0.5 h-8 max-w-[7.5rem] shrink-0 rounded-lg border border-line bg-transparent px-1.5 text-[11px] text-muted sm:max-w-none"
        >
          {(Object.keys(STATUS_KEY) as Status[]).map((status) => (
            <option key={status} value={status}>
              {withMark(STATUS_MARK[status], t(STATUS_KEY[status]))}
            </option>
          ))}
        </select>

        <div className="hidden items-center gap-0.5 opacity-0 transition focus-within:opacity-100 group-hover:opacity-100 md:flex">
          {!done ? (
            <>
              <IconButton label={t('task.moveToTomorrow')} onClick={() => void moveToTomorrow(task)}>
                <CalendarArrowUp className="h-4 w-4" />
              </IconButton>
              <IconButton label={t('task.startFocus')} onClick={() => navigate(`/focus/${task.id}`)}>
                <Timer className="h-4 w-4" />
              </IconButton>
            </>
          ) : null}
          <IconButton label={t('task.edit')} onClick={() => selectTask(task.id)}>
            <Pencil className="h-4 w-4" />
          </IconButton>
          <IconButton label={t('task.delete')} onClick={() => confirmRemove(task)}>
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    </motion.li>
  )
}
