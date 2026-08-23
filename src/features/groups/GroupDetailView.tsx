import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useGroupStore } from '@/stores/useGroupStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToast } from '@/components/ui/Toast'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Tabs } from '@/components/ui/Tabs'
import { EmptyState } from '@/components/ui/EmptyState'
import { AddGroupExpenseModal } from './AddGroupExpenseModal'
import { GroupInviteModal } from './GroupInviteModal'
import { SettleUpModal } from '@/features/settlements/SettleUpModal'
import { formatINR } from '@/domain/money/money'
import { formatFriendlyDate } from '@/utils/dateUtils'
import { CATEGORY_DEFINITIONS } from '@/domain/expenses/categories'
import {
  Users,
  UserPlus,
  Plus,
  ArrowLeft,
  ArrowRight,
  Handshake,
  Receipt,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { clsx } from 'clsx'

export const GroupDetailView: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { showToast } = useToast()

  const {
    activeGroup,
    activeGroupMembers,
    activeGroupExpenses,
    activeGroupSettlements,
    activeGroupBalances,
    activeGroupProposedSettlements,
    setActiveGroupId,
    subscribeActiveGroupDetails,
    openAddGroupExpenseModal,
    openSettleUpModal,
    openInviteModal,
    exitGroup,
  } = useGroupStore()

  const [activeTab, setActiveTab] = useState<'expenses' | 'settlements' | 'members'>('expenses')
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    if (groupId) {
      setActiveGroupId(groupId)
      const unsub = subscribeActiveGroupDetails(groupId)
      return () => {
        unsub()
        setActiveGroupId(null)
      }
    }
  }, [groupId, setActiveGroupId, subscribeActiveGroupDetails])

  const handleLeaveGroup = async () => {
    if (!groupId || !user || isLeaving) return
    if (!window.confirm('Are you sure you want to leave this group?')) return

    setIsLeaving(true)
    try {
      await exitGroup(groupId, user.uid)
      showToast('You have left the group', 'info')
      navigate('/groups')
    } catch (err: any) {
      showToast(err?.message || 'Failed to leave group', 'error')
    } finally {
      setIsLeaving(false)
    }
  }

  if (!activeGroup) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">Loading group details...</p>
      </div>
    )
  }

  const userBalance = user ? activeGroupBalances[user.uid] : null
  const netPaise = userBalance ? userBalance.netBalancePaise : 0

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/groups"
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Groups</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={openInviteModal}
            leftIcon={<UserPlus className="h-3.5 w-3.5" />}
          >
            Invite
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10"
            onClick={handleLeaveGroup}
            isLoading={isLeaving}
            title="Leave group"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Group Hero Card */}
      <Card className="p-5 sm:p-6 bg-gradient-to-br from-card via-card to-primary/5 border-border/80 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 xs:gap-4 min-w-0 flex-1">
            <div className="w-12 h-12 xs:w-14 xs:h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl shrink-0 shadow-sm">
              <Users className="h-6 w-6 xs:h-7 xs:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl xs:text-2xl sm:text-3xl font-black text-foreground tracking-tight break-words">
                {activeGroup.name}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                {activeGroup.description || 'Shared expense group'} •{' '}
                {activeGroupMembers.length} members
              </p>
            </div>
          </div>

          {/* User's personal net status in this group */}
          <div className="sm:text-right bg-muted/40 sm:bg-transparent p-2.5 xs:p-3 sm:p-0 rounded-xl shrink-0">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Your Net Balance
            </span>
            <p
              className={clsx(
                'text-xl xs:text-2xl font-black mt-0.5 tabular-nums',
                netPaise > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : netPaise < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-foreground'
              )}
            >
              {netPaise > 0
                ? `+${formatINR(netPaise)}`
                : netPaise < 0
                ? `-${formatINR(Math.abs(netPaise))}`
                : 'Settled up'}
            </p>
            <span className="text-[11px] text-muted-foreground">
              {netPaise > 0
                ? 'You are owed'
                : netPaise < 0
                ? 'You owe the group'
                : 'Zero net debt'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 xs:gap-3 pt-2 border-t border-border/60">
          <Button
            onClick={openAddGroupExpenseModal}
            variant="primary"
            className="flex-1 justify-center shadow-md shadow-primary/20 font-bold"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Shared Expense
          </Button>
          <Button
            onClick={openSettleUpModal}
            variant="secondary"
            className="flex-1 justify-center font-bold"
            leftIcon={<Handshake className="h-4 w-4" />}
          >
            Settle Up
          </Button>
        </div>
      </Card>

      {/* Balances & Debt Simplification Summary */}
      {activeGroupProposedSettlements.length > 0 && (
        <Card className="p-4 sm:p-5 border-primary/20 bg-primary/[0.02] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Suggested Settlements</h3>
            </div>
            <button
              onClick={openSettleUpModal}
              className="text-xs font-bold text-primary hover:underline"
            >
              Settle Now &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeGroupProposedSettlements.map((prop, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/60 text-xs"
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                  <span className="font-bold text-foreground truncate">
                    {prop.fromUserId === user?.uid ? 'You' : prop.fromName}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="font-bold text-foreground truncate">
                    {prop.toUserId === user?.uid ? 'You' : prop.toName}
                  </span>
                </div>
                <span className="font-extrabold text-foreground shrink-0 tabular-nums">
                  {formatINR(prop.amountPaise)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'expenses',
            label: 'Expenses',
            badge: activeGroupExpenses.length,
          },
          {
            id: 'settlements',
            label: 'Settlements',
            badge: activeGroupSettlements.length,
          },
          {
            id: 'members',
            label: 'Members & Balances',
            badge: activeGroupMembers.length,
          },
        ]}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
      />

      {/* Tab 1: Group Expenses */}
      {activeTab === 'expenses' && (
        <div className="space-y-3">
          {activeGroupExpenses.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-6 w-6" />}
              title="No group expenses yet"
              description="Add dinner, cab fares, or grocery bills to start splitting."
              actionLabel="+ Add First Shared Expense"
              onAction={openAddGroupExpenseModal}
            />
          ) : (
            <div className="space-y-2.5">
              {activeGroupExpenses.map((exp) => {
                const isPayer = exp.payerId === user?.uid
                const userShare = user ? exp.participants[user.uid] : null
                const meta = CATEGORY_DEFINITIONS[exp.category] || CATEGORY_DEFINITIONS.Other

                return (
                  <Card
                    key={exp.id}
                    className="p-4 flex items-center justify-between border-border/70 shadow-sm"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0"
                        style={{
                          backgroundColor: `${meta.color}15`,
                          color: meta.color,
                        }}
                      >
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-foreground truncate">
                          {exp.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Paid by{' '}
                          <strong className="text-foreground">
                            {isPayer ? 'You' : exp.payerSnapshot.displayName}
                          </strong>{' '}
                          • {formatFriendlyDate(exp.date)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-3">
                      <p className="text-sm sm:text-base font-black text-foreground">
                        {formatINR(exp.amountPaise)}
                      </p>
                      {userShare ? (
                        <p className="text-[11px] font-semibold text-muted-foreground">
                          Your share: {formatINR(userShare.amountPaise)}
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">Not involved</p>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Settlements History */}
      {activeTab === 'settlements' && (
        <div className="space-y-3">
          {activeGroupSettlements.length === 0 ? (
            <EmptyState
              icon={<Handshake className="h-6 w-6" />}
              title="No settlements recorded"
              description="Record payments between members when debts are paid off."
              actionLabel="Record Settlement"
              onAction={openSettleUpModal}
            />
          ) : (
            <div className="space-y-2.5">
              {activeGroupSettlements.map((stl) => (
                <Card
                  key={stl.id}
                  className="p-4 flex items-center justify-between border-border/70 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Handshake className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        <strong>{stl.payerId === user?.uid ? 'You' : stl.payerSnapshot.displayName}</strong>{' '}
                        paid{' '}
                        <strong>{stl.receiverId === user?.uid ? 'You' : stl.receiverSnapshot.displayName}</strong>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {formatFriendlyDate(stl.date)} {stl.note ? `• ${stl.note}` : ''}
                      </p>
                    </div>
                  </div>

                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                    {formatINR(stl.amountPaise)}
                  </span>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Members & Balances Matrix */}
      {activeTab === 'members' && (
        <div className="space-y-3">
          <div className="space-y-2">
            {activeGroupMembers.map((member) => {
              const b = activeGroupBalances[member.userId]
              const net = b ? b.netBalancePaise : 0
              const isCurrentUser = member.userId === user?.uid

              return (
                <Card
                  key={member.userId}
                  className="p-3.5 flex items-center justify-between border-border/70 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={member.photoURL} name={member.displayName} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-foreground truncate">
                          {isCurrentUser ? `${member.displayName} (You)` : member.displayName}
                        </span>
                        {member.role === 'owner' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                            Owner
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Paid: {formatINR(b?.totalPaidPaise || 0)} • Share:{' '}
                        {formatINR(b?.totalOwedPaise || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <span
                      className={clsx(
                        'text-sm font-black',
                        net > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : net < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-muted-foreground'
                      )}
                    >
                      {net > 0 ? `+${formatINR(net)}` : net < 0 ? `-${formatINR(Math.abs(net))}` : '₹0'}
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      {net > 0 ? 'gets back' : net < 0 ? 'owes' : 'settled'}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Mount Modals */}
      <AddGroupExpenseModal />
      <GroupInviteModal />
      <SettleUpModal />
    </div>
  )
}
