import React, { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useGroupStore } from '@/stores/useGroupStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToast } from '@/components/ui/Toast'
import { createGroupInvite } from '@/services/firebase/groupService'
import { GroupInvite } from '@/types/group'
import { Copy, Check, QrCode, MessageCircle } from 'lucide-react'

export const GroupInviteModal: React.FC = () => {
  const { isInviteModalOpen, closeInviteModal, activeGroup } = useGroupStore()
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const { showToast } = useToast()

  const [invite, setInvite] = useState<GroupInvite | null>(null)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (isInviteModalOpen && activeGroup && user) {
      createGroupInvite(
        activeGroup.id,
        activeGroup.name,
        {
          uid: user.uid,
          displayName: profile?.displayName || user.displayName || 'Member',
        },
        7 // 7 days validity
      )
        .then((inv) => {
          setInvite(inv)
        })
        .catch((err) => {
          console.error(err)
        })
    }
  }, [isInviteModalOpen, activeGroup, user, profile])

  const inviteUrl = invite
    ? `${window.location.origin}/join/${invite.inviteCode}`
    : ''

  // Render QR Code onto canvas
  useEffect(() => {
    if (inviteUrl && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        inviteUrl,
        {
          width: 200,
          margin: 1.5,
          color: {
            dark: '#0d9488',
            light: '#ffffff',
          },
        },
        (err) => {
          if (err) console.error('QR code generation error:', err)
        }
      )
    }
  }, [inviteUrl])

  const handleCopy = () => {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    showToast('Invite link copied to clipboard!', 'success')
    setTimeout(() => setCopied(false), 2500)
  }

  const handleWhatsAppShare = () => {
    if (!inviteUrl || !activeGroup) return
    const text = encodeURIComponent(
      `Join my split group "${activeGroup.name}" on Oweo to track and settle our shared expenses:\n${inviteUrl}`
    )
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  return (
    <Dialog
      isOpen={isInviteModalOpen}
      onClose={closeInviteModal}
      title="Invite to Group"
      description={`Share link or scan QR code to join ${activeGroup?.name || 'Group'}`}
    >
      <div className="space-y-5 pt-1">
        {/* QR Code Canvas */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/40 border border-border/70">
          <canvas ref={canvasRef} className="rounded-xl shadow-md" />
          <span className="text-xs font-semibold text-muted-foreground mt-3 flex items-center gap-1">
            <QrCode className="h-3.5 w-3.5 text-primary" />
            Scan with any camera or QR scanner
          </span>
        </div>

        {/* Invite Code & Link Box */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-foreground/80 uppercase tracking-wide">
            Invite Link (Valid for 7 days)
          </label>
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
            <div className="flex-1 min-w-0">
              <Input
                readOnly
                value={inviteUrl}
                className="font-mono text-xs select-all bg-card"
              />
            </div>
            <Button
              type="button"
              variant={copied ? 'secondary' : 'primary'}
              size="md"
              onClick={handleCopy}
              className="shrink-0 justify-center"
              leftIcon={copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* WhatsApp Share Shortcut */}
        <div className="pt-1">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-center border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-bold"
            onClick={handleWhatsAppShare}
            leftIcon={<MessageCircle className="h-4 w-4 text-emerald-500" />}
          >
            Share on WhatsApp
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
