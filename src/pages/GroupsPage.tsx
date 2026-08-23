import React from 'react'
import { useGroupStore } from '@/stores/useGroupStore'
import { GroupCard } from '@/features/groups/GroupCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Users, Plus } from 'lucide-react'

export const GroupsPage: React.FC = () => {
  const { groups, openCreateGroupModal } = useGroupStore()

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Split Groups
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Share expenses with roommates, trips, and friends
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={openCreateGroupModal}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create Group
        </Button>
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No groups created yet"
          description="Create a group for your flatmates, road trips, or project team to automatically split and settle debts."
          actionLabel="+ Create First Group"
          onAction={openCreateGroupModal}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  )
}
