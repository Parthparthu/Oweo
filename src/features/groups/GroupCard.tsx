import React from 'react'
import { Link } from 'react-router-dom'
import { Group } from '@/types/group'
import { Card } from '@/components/ui/Card'
import { Users, ArrowRight } from 'lucide-react'

interface Props {
  group: Group
}

export const GroupCard: React.FC<Props> = ({ group }) => {
  return (
    <Link to={`/groups/${group.id}`} className="block group">
      <Card variant="interactive" className="p-4 sm:p-5 flex items-center justify-between">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0 group-hover:scale-105 transition-transform">
            <Users className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
              {group.name}
            </h3>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {group.description || `${group.memberIds.length} members`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center -space-x-2">
            {group.memberIds.slice(0, 3).map((id, i) => (
              <div
                key={id}
                className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-bold text-muted-foreground"
              >
                {i + 1}
              </div>
            ))}
            {group.memberIds.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-[10px] font-bold text-primary">
                +{group.memberIds.length - 3}
              </div>
            )}
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </Card>
    </Link>
  )
}
