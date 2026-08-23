import React, { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useGroupStore } from '@/stores/useGroupStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToast } from '@/components/ui/Toast'
import { Users } from 'lucide-react'

export const CreateGroupModal: React.FC = () => {
  const { isCreateGroupModalOpen, closeCreateGroupModal, createNewGroup } = useGroupStore()
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const { showToast } = useToast()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter a group name')
      return
    }
    if (!user) return

    setIsSubmitting(true)
    setError('')

    try {
      const group = await createNewGroup(
        name.trim(),
        description.trim(),
        {
          uid: user.uid,
          displayName: profile?.displayName || user.displayName || 'Creator',
          email: user.email,
          photoURL: user.photoURL,
        }
      )
      showToast(`Group "${group.name}" created!`, 'success')
      setName('')
      setDescription('')
      closeCreateGroupModal()
    } catch (err: any) {
      setError(err?.message || 'Failed to create group')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      isOpen={isCreateGroupModalOpen}
      onClose={closeCreateGroupModal}
      title="Create Split Group"
      description="Track and split expenses with roommates, trips, or friends"
    >
      <form onSubmit={handleCreate} className="space-y-4">
        <Input
          label="Group Name"
          placeholder="e.g. Roommates 304, Goa Trip 2026, Flatmates"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (error) setError('')
          }}
          autoFocus
          error={error}
          leftIcon={<Users className="h-4 w-4 text-primary" />}
        />

        <Input
          label="Description (Optional)"
          placeholder="e.g. Shared grocery, rent and outing expenses"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex flex-wrap sm:flex-nowrap justify-end gap-2 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={closeCreateGroupModal}
            className="flex-1 sm:flex-initial"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="flex-1 sm:flex-initial"
          >
            Create Group
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
