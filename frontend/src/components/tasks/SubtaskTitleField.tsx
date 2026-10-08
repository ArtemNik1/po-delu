import { useCallback, useEffect, useRef, useState } from 'react'
import { subtaskDraftKey, useDraftStore } from '../../store/draftStore'
import type { Subtask } from '../../types/database'

interface SubtaskTitleFieldProps {
  subtask: Subtask
  label: string
  onSave: (id: string, title: string) => Promise<boolean>
}

export function SubtaskTitleField({ subtask, label, onSave }: SubtaskTitleFieldProps) {
  const draftKey = subtaskDraftKey(subtask.user_id, subtask.id)
  const pending = useDraftStore((state) => state.drafts[draftKey])
  const [local, setLocal] = useState<string | null>(null)
  const draft = local ?? pending ?? subtask.title
  const draftRef = useRef(draft)
  const savedRef = useRef(subtask.title)
  const saveRef = useRef(onSave)
  const flushRef = useRef<() => Promise<boolean>>(async () => true)
  const flight = useRef<Promise<boolean> | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    draftRef.current = draft
    saveRef.current = onSave
    if (local === null && pending === undefined) savedRef.current = subtask.title
  })

  const flush = useCallback(async (): Promise<boolean> => {
    if (flight.current) {
      await flight.current
      return flushRef.current()
    }
    const next = draftRef.current.trim()
    if (!next) {
      draftRef.current = savedRef.current
      useDraftStore.getState().clearDraft(draftKey)
      if (mounted.current) setLocal(null)
      return true
    }
    if (next === savedRef.current) {
      useDraftStore.getState().clearDraft(draftKey)
      if (mounted.current) setLocal(null)
      return true
    }

    const run = saveRef.current(subtask.id, next).then((ok) => {
      if (ok) savedRef.current = next
      if (ok && draftRef.current.trim() === next) useDraftStore.getState().clearDraft(draftKey)
      return ok
    })
    flight.current = run
    try {
      return await run
    } finally {
      if (flight.current === run) flight.current = null
    }
  }, [draftKey, subtask.id])

  useEffect(() => {
    flushRef.current = flush
  })

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      void flush()
    }
  }, [flush])

  return (
    <input
      aria-label={label}
      className="min-w-0 flex-1 rounded-lg bg-transparent px-1 py-1 text-sm outline-none hover:bg-ink/4 focus:bg-ink/5"
      value={draft}
      onChange={(event) => {
        const value = event.target.value
        draftRef.current = value
        setLocal(value)
        if (value.trim() === savedRef.current) {
          useDraftStore.getState().clearDraft(draftKey)
          setLocal(null)
        } else {
          useDraftStore.getState().setDraft(draftKey, value)
        }
      }}
      onBlur={() => {
        void flush()
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter') return
        event.preventDefault()
        void flush()
      }}
    />
  )
}
