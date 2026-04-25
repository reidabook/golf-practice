'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { SessionWithDrills, SessionDrill } from '@/lib/types'
import { reorderDrills, deleteSession } from '@/lib/actions/sessions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { GripVertical, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface SessionOverviewClientProps {
  session: SessionWithDrills
}

export function SessionOverviewClient({ session }: SessionOverviewClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [drills, setDrills] = useState<SessionDrill[]>(
    [...session.drills].sort((a, b) => a.sort_order - b.sort_order)
  )
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [reordered, setReordered] = useState(false)

  const isCompleted = session.status === 'completed'
  const orderParam = drills.map((d) => d.drill_id).join(',')

  function handleDragStart(index: number) {
    setDragIndex(index)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    setDragOverIndex(index)
  }

  function handleDrop(index: number) {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    const next = [...drills]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(index, 0, moved)
    setDrills(next)
    setReordered(true)
    setDragIndex(null)
    setDragOverIndex(null)
  }

  function handleBeginSession() {
    startTransition(async () => {
      if (reordered) {
        await reorderDrills(
          session.id,
          drills.map((d) => d.drill_id)
        )
      }
      const firstDrill = drills[0]
      if (firstDrill) {
        router.push(
          `/sessions/${session.id}/drill/${firstDrill.drill_id}?order=${orderParam}&pos=1&total=${drills.length}`
        )
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteSession(session.id)
      } catch (e) {
        toast.error('Failed to delete session')
      }
    })
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">
          Session {session.session_number} — {session.block.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{formatDate(session.session_date)}</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {isCompleted ? 'Drills' : 'Drill Order'} {!isCompleted && '— drag to reorder'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {drills.map((sd, i) => (
            <div
              key={sd.drill_id}
              draggable={!isCompleted}
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={() => handleDrop(i)}
              className={`flex items-center gap-3 px-4 py-4 border-b border-border last:border-0 transition-colors ${
                dragOverIndex === i ? 'bg-accent' : ''
              }`}
            >
              {!isCompleted && (
                <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0 cursor-grab" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{sd.drill.name}</p>
                <p className="text-xs text-muted-foreground">{sd.drill.unit}</p>
              </div>
              <div className="flex items-center gap-2">
                {sd.skipped ? (
                  <Badge variant="secondary" className="text-xs">Skipped</Badge>
                ) : sd.score !== null ? (
                  <span className="text-sm font-mono font-bold">{sd.score}</span>
                ) : null}
                <Badge variant="outline" className="text-xs">
                  {sd.drill.scoring_direction === 'higher_better' ? '↑' : '↓'}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {!isCompleted && (
        <div className="space-y-3">
          <Button
            onClick={handleBeginSession}
            disabled={isPending}
            className="w-full"
            size="lg"
          >
            {isPending ? 'Starting...' : 'Begin Session'}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="w-full text-destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete this session
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete session?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete Session {session.session_number} and all entered
                  scores. This can&apos;t be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  )
}
