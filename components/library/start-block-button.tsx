'use client'

import { useTransition } from 'react'
import { startBlock } from '@/lib/actions/blocks'
import { Button, type ButtonProps } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

/**
 * Starts a block from a template. One block runs at a time, so when one is already
 * running this asks before ending it early.
 */
export function StartBlockButton({
  templateId,
  templateName,
  activeBlockName,
  size = 'sm',
  className,
}: {
  templateId: string
  templateName: string
  activeBlockName: string | null
  size?: ButtonProps['size']
  className?: string
}) {
  const [pending, startTransition] = useTransition()
  const start = () => startTransition(() => startBlock(templateId))

  if (!activeBlockName) {
    return (
      <Button size={size} className={className} onClick={start} disabled={pending}>
        {pending ? 'Starting…' : 'Start'}
      </Button>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size={size} variant="outline" className={className} disabled={pending}>
          {pending ? 'Starting…' : 'Start'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>End {activeBlockName} and start {templateName}?</AlertDialogTitle>
          <AlertDialogDescription>
            One block runs at a time. {activeBlockName} moves to Progress as ended early; its scores are kept.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep current block</AlertDialogCancel>
          <AlertDialogAction onClick={start}>End and start</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
