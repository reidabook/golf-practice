'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface DrillInstructionsProps {
  instructions: string
}

export function DrillInstructions({ instructions }: DrillInstructionsProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
      >
        <span>Instructions</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="px-4 py-3 text-sm text-muted-foreground border-t border-border">
          {instructions}
        </div>
      )}
    </div>
  )
}
