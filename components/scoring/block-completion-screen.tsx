'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { completeBlock, extendBlock } from '@/lib/actions/blocks'

interface BlockCompletionScreenProps {
  blockId: string
  blockName: string
  targetSessions: number
  onKeepGoing: () => void
}

export function BlockCompletionScreen({
  blockId,
  blockName,
  targetSessions,
  onKeepGoing,
}: BlockCompletionScreenProps) {
  const [view, setView] = useState<'main' | 'extend'>('main')
  const [extraSessions, setExtraSessions] = useState('4')
  const [saving, setSaving] = useState(false)

  async function handleComplete() {
    setSaving(true)
    await completeBlock(blockId) // redirects to /history/[blockId]
  }

  async function handleExtend() {
    const n = parseInt(extraSessions, 10)
    if (!n || n < 1) return
    setSaving(true)
    await extendBlock(blockId, n)
    onKeepGoing()
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-5 text-center max-w-sm w-full">
        <span className="text-6xl">🏆</span>

        <div>
          <h2 className="text-2xl font-bold">Block Complete!</h2>
          <p className="text-muted-foreground mt-1">{blockName}</p>
          <p className="text-sm text-muted-foreground mt-2">
            All drills completed across {targetSessions} session{targetSessions !== 1 ? 's' : ''}. What would you like to do?
          </p>
        </div>

        {view === 'extend' ? (
          <div className="w-full space-y-3">
            <div className="space-y-1.5 text-left">
              <Label htmlFor="extra-sessions">Additional sessions to add</Label>
              <Input
                id="extra-sessions"
                type="number"
                min="1"
                max="52"
                value={extraSessions}
                onChange={(e) => setExtraSessions(e.target.value)}
              />
            </div>
            <Button onClick={handleExtend} disabled={saving} className="w-full" size="lg">
              {saving ? 'Saving…' : `Add ${extraSessions || '?'} sessions`}
            </Button>
            <Button variant="ghost" onClick={() => setView('main')} disabled={saving} className="w-full">
              Back
            </Button>
          </div>
        ) : (
          <div className="w-full space-y-3 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]">
            <Button onClick={handleComplete} disabled={saving} className="w-full" size="lg">
              {saving ? 'Saving…' : 'Complete Block'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setView('extend')}
              disabled={saving}
              className="w-full"
              size="lg"
            >
              Extend Block
            </Button>
            <Button
              variant="ghost"
              onClick={onKeepGoing}
              disabled={saving}
              className="w-full"
              size="lg"
            >
              Keep Going
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
