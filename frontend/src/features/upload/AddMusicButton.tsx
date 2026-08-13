import { useState } from 'react'
import { Button, type ButtonProps } from '../../components/ui/Button'
import { PlusIcon } from '../../components/ui/icons'
import { UploadModal } from './UploadModal'
import type { UploadResult } from '../../api/upload'

interface AddMusicButtonProps {
  onUploaded?: (result: UploadResult) => void
  size?: ButtonProps['size']
  label?: string
}

export function AddMusicButton({ onUploaded, size = 'md', label = 'Add music' }: AddMusicButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size={size} onClick={() => setOpen(true)}>
        <PlusIcon className="h-4 w-4" />
        {label}
      </Button>
      {open ? <UploadModal onClose={() => setOpen(false)} onUploaded={onUploaded} /> : null}
    </>
  )
}
