import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { AnimatePresence } from 'framer-motion'
import { useDataStore } from '../../store/dataStore'
import type { Task } from '../../types/database'
import { moveInList } from '../../utils/tasks'
import { SortableTaskRow, TaskRow } from './TaskRow'

interface TaskListProps {
  tasks: Task[]
  /** Drag-and-drop is only meaningful where the order is user-controlled. */
  reorderable?: boolean
  showDate?: boolean
  ariaLabel?: string
}

export function TaskList({ tasks, reorderable = false, showDate = false, ariaLabel }: TaskListProps) {
  const reorderTasks = useDataStore((state) => state.reorderTasks)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = tasks.map((task) => task.id)
    const next = moveInList(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)))
    if (next !== ids) void reorderTasks(next)
  }

  if (!reorderable) {
    return (
      <ul aria-label={ariaLabel} className="space-y-1.5">
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} showDate={showDate} />
          ))}
        </AnimatePresence>
      </ul>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <ul aria-label={ariaLabel} className="space-y-1.5">
          <AnimatePresence initial={false}>
            {tasks.map((task) => (
              <SortableTaskRow key={task.id} task={task} showDate={showDate} />
            ))}
          </AnimatePresence>
        </ul>
      </SortableContext>
    </DndContext>
  )
}
