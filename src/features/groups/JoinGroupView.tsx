import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToast } from '@/components/ui/Toast'
import { redeemGroupInvite, fetchGroupInvite } from '@/services/firebase/groupService'
import { GroupInvite } from '@/types/group'
import { Users, CheckCircle2, AlertCircle, Clock, ShieldAlert } from 'lucide-react'

export const JoinGroupView: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const { showToast } = useToast()

  const [isLoadingPreview, setIsLoadingPreview] = useState(true)
  const [inviteData, setInviteData] = useState<GroupInvite | null>(null)
  const [isExpired, setIsExpired] = useState(false)
  const [isRevoked, setIsRevoked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successGroup, setSuccessGroup] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    if (!inviteCode) {
      setIsLoadingPreview(false)
      setError('No invite code provided')
      return
    }

    let isMounted = true
    setIsLoadingPreview(true)
    setError('')

    fetchGroupInvite(inviteCode)
      .then((res) => {
        if (!isMounted) return
        setInviteData(res.invite)
        setIsExpired(res.isExpired)
        setIsRevoked(res.isRevoked)
      })
      .catch((err: any) => {
        if (!isMounted) return
        setError(err?.message || 'Invalid or expired invite link')
      })
      .finally(() => {
        if (isMounted) setIsLoadingPreview(false)
      })

    return () => {
      isMounted = false
    }
  }, [inviteCode])

  const handleJoin = async () => {
    if (!inviteCode || !user) return

    setIsLoading(true)
    setError('')

    try {
      const res = await redeemGroupInvite(inviteCode, {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName || 'Member',
        email: user.email,
        photoURL: user.photoURL,
      })

      showToast(res.message || 'Joined group successfully!', 'success')
      setSuccessGroup({ id: res.groupId, name: res.groupName })
      setTimeout(() => {
        navigate(`/groups/${res.groupId}`)
      }, 1200)
    } catch (err: any) {
      setError(err?.message || 'Failed to join group')
    } finally {
      setIsLoading(false)
    }
  }

  const isActionDisabled = Boolean(successGroup) || isExpired || isRevoked || isLoadingPreview || !inviteData

  return (
    <div className="min-h-[70dvh] flex items-center justify-center p-3 xs:p-4">
      <Card className="max-w-md w-full p-4 xs:p-6 text-center space-y-4 xs:space-y-5 border-border shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <Users className="h-7 w-7" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground">
            {inviteData ? `Join ${inviteData.groupName}` : 'Join Split Group'}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Invite Code: <strong className="font-mono text-primary">{inviteCode}</strong>
          </p>
        </div>

        {isLoadingPreview ? (
          <div className="p-4 rounded-xl bg-muted/40 animate-pulse text-xs text-muted-foreground">
            Loading invitation details...
          </div>
        ) : isRevoked ? (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>This invitation link has been revoked by the group admin.</span>
          </div>
        ) : isExpired ? (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" />
            <span>This invitation link has expired. Please ask for a new invite.</span>
          </div>
        ) : error ? (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : successGroup ? (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Joined {successGroup.name}! Redirecting...</span>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5 text-xs text-left">
            <p className="text-foreground">
              Invited by <strong className="font-bold">{inviteData?.creatorName || 'A group member'}</strong>
            </p>
            <p className="text-muted-foreground text-[11px]">
              You will join as <strong className="text-foreground">{profile?.displayName || user?.displayName || 'Member'}</strong>.
            </p>
          </div>
        )}

        <div className="flex flex-wrap sm:flex-nowrap gap-2 justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => navigate('/groups')}
            className="flex-1 sm:flex-initial"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            isLoading={isLoading}
            onClick={handleJoin}
            disabled={isActionDisabled}
            className="flex-1 sm:flex-initial font-bold"
          >
            Join Group
          </Button>
        </div>
      </Card>
    </div>
  )
}
