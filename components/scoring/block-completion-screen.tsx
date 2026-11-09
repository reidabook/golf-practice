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
    <div className="fixed inset-0 z-[70] flex flex-col bg-background px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))]">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6">
        <div>
          <p className="label mb-2 text-fairway">Target reached</p>
          <h2 className="screen-title text-[28px]">{blockName}</h2>
          <p className="mt-3 text-[15px] text-muted-foreground">
            Every drill has {targetSessions} session{targetSessions !== 1 ? 's' : ''} logged. Finish the block, add more sessions, or keep scoring without changing anything.
          </p>
        </div>

        {view === 'extend' ? (
          <div className="w-full space-y-3">
            <div className="space-y-1.5 text-left">
              <Label htmlFor="extra-sessions">Sessions to add</Label>
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
          <div className="w-full space-y-2">
            <Button onClick={handleComplete} disabled={saving} className="w-full" size="lg">
              {saving ? 'Saving…' : 'Complete block'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setView('extend')}
              disabled={saving}
              className="w-full"
              size="lg"
            >
              Add sessions
            </Button>
            <Button
              variant="ghost"
              onClick={onKeepGoing}
              disabled={saving}
              className="w-full"
              size="lg"
            >
              Keep going
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
