import React, { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToast } from '@/components/ui/Toast'
import { AlertTriangle, Trash2 } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export const AccountDeletionModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const deleteAccount = useAuthStore((state) => state.deleteAccount)
  const { showToast } = useToast()

  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    if (confirmText.trim().toLowerCase() !== 'delete my account') {
      setError('Please type "delete my account" exactly to proceed')
      return
    }

    setIsDeleting(true)
    setError('')

    try {
      await deleteAccount()
      showToast('Your account and private expenses have been deleted.', 'info')
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to delete account. Please re-authenticate and try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Account & Data"
    >
      <div className="space-y-4 pt-1">
        <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-xs text-destructive space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Permanent Action</span>
          </div>
          <p>
            This will permanently delete your user profile and all personal expenses. Your participation in shared group calculations will be preserved as immutable snapshots for other group members.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-foreground">
            Type <span className="font-mono text-destructive">delete my account</span> to confirm:
          </label>
          <Input
            value={confirmText}
            onChange={(e) => {
              setConfirmText(e.target.value)
              if (error) setError('')
            }}
            placeholder="delete my account"
            error={error}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            isLoading={isDeleting}
            onClick={handleDelete}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            Permanently Delete
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
