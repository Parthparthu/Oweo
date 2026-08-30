import React, { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { GroupMember } from '@/types/group'
import { formatINR, parseAmountInput } from '@/domain/money/money'
import {
  parseReceiptText,
  calculateItemizedShares,
  ReceiptLineItem,
} from '@/domain/ocr/receiptParser'
import {
  Sparkles,
  Plus,
  Trash2,
  Users,
  CheckCircle2,
  FileText,
} from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  isOpen: boolean
  onClose: () => void
  members: GroupMember[]
  onApplyItemizedSplit: (params: {
    totalPaise: number
    title: string
    shares: Record<string, number>
  }) => void
}

export const ReceiptScannerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  members,
  onApplyItemizedSplit,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'text' | 'itemize'>('text')
  const [rawText, setRawText] = useState(
    `Trattoria Mario\n1 Margherita Pizza 450.00\n1 Veggie Pasta 380.00\n2 Garlic Bread 180.00\n1 Tiramisu 220.00\nCGST @ 2.5% 30.75\nSGST @ 2.5% 30.75\nTotal 1291.50`
  )
  const [merchantTitle, setMerchantTitle] = useState('')
  const [items, setItems] = useState<ReceiptLineItem[]>([])
  const [totalPaise, setTotalPaise] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  const memberIds = members.map((m) => m.userId)

  const handleParse = (textToParse: string) => {
    setIsProcessing(true)
    try {
      const parsed = parseReceiptText(textToParse)
      setMerchantTitle(parsed.merchantName || 'Restaurant Bill')
      setItems(parsed.items)
      setTotalPaise(parsed.totalPaise)
      setActiveTab('itemize')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleToggleClaim = (itemId: string, userId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        const exists = item.claimedByUserIds.includes(userId)
        const updatedClaimants = exists
          ? item.claimedByUserIds.filter((id) => id !== userId)
          : [...item.claimedByUserIds, userId]
        return { ...item, claimedByUserIds: updatedClaimants }
      })
    )
  }

  const handleClaimEveryone = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        const allClaimed = item.claimedByUserIds.length === memberIds.length
        return {
          ...item,
          claimedByUserIds: allClaimed ? [] : [...memberIds],
        }
      })
    )
  }

  const handleAddItem = () => {
    const newItem: ReceiptLineItem = {
      id: `custom_${Date.now()}`,
      name: 'New Item',
      pricePaise: 10000,
      claimedByUserIds: [],
    }
    setItems((prev) => [...prev, newItem])
    setTotalPaise((prev) => prev + 10000)
  }

  const handleRemoveItem = (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return
    setItems((prev) => prev.filter((i) => i.id !== id))
    setTotalPaise((prev) => Math.max(0, prev - item.pricePaise))
  }

  const handleItemChange = (id: string, name: string, priceStr: string) => {
    const parsed = parseAmountInput(priceStr) || 0
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, name, pricePaise: parsed } : i))
    )
  }

  // Calculate live breakdown
  const computedShares = calculateItemizedShares(items, totalPaise, memberIds)

  const handleApply = () => {
    const shareMap: Record<string, number> = {}
    Object.entries(computedShares).forEach(([uid, share]) => {
      shareMap[uid] = share.totalSharePaise
    })

    onApplyItemizedSplit({
      totalPaise,
      title: merchantTitle || 'Itemized Bill',
      shares: shareMap,
    })
    onClose()
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Receipt Scanner & Itemized Split"
      description="Extract bill line items and let members claim what they ordered"
    >
      <div className="space-y-4 pt-1">
        {/* Navigation Mode */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={clsx(
              'flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5',
              activeTab === 'text' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Paste / Sample Bill</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('itemize')}
            disabled={items.length === 0}
            className={clsx(
              'flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5',
              activeTab === 'itemize' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground disabled:opacity-50'
            )}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Claim Items ({items.length})</span>
          </button>
        </div>

        {activeTab === 'text' ? (
          /* Step 1: Input Raw Bill Text / OCR Mock */
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Paste or edit the receipt text below. Our parser will extract items, prices, taxes, and service charges.
            </p>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste receipt lines here..."
              className="w-full rounded-xl border border-input bg-card p-3 text-xs font-mono text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="primary"
                size="md"
                isLoading={isProcessing}
                onClick={() => handleParse(rawText)}
                leftIcon={<Sparkles className="h-4 w-4" />}
                className="font-bold"
              >
                Extract Line Items
              </Button>
            </div>
          </div>
        ) : (
          /* Step 2: Interactive Item Claiming */
          <div className="space-y-4">
            {/* Header & Total */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border/70 shadow-sm">
              <div>
                <Input
                  value={merchantTitle}
                  onChange={(e) => setMerchantTitle(e.target.value)}
                  placeholder="Restaurant or Bill Title"
                  className="h-8 text-xs font-extrabold border-none p-0 bg-transparent focus-visible:ring-0"
                />
                <span className="text-[11px] text-muted-foreground">
                  {items.length} items extracted
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                  Total Bill
                </span>
                <span className="text-base font-black text-foreground tabular-nums">
                  {formatINR(totalPaise)}
                </span>
              </div>
            </div>

            {/* Line items claiming list */}
            <div className="space-y-2.5 max-h-64 overflow-y-auto overscroll-contain pr-1">
              {items.map((item) => {
                const isEveryoneClaimed =
                  item.claimedByUserIds.length === memberIds.length ||
                  item.claimedByUserIds.length === 0

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-card border border-border/60 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            e.target.value,
                            (item.pricePaise / 100).toString()
                          )
                        }
                        className="font-bold text-foreground bg-transparent flex-1 focus:outline-none border-b border-transparent focus:border-primary"
                      />
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-extrabold text-foreground tabular-nums">
                          {formatINR(item.pricePaise)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Member Claim Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <button
                        type="button"
                        onClick={() => handleClaimEveryone(item.id)}
                        className={clsx(
                          'px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors select-none',
                          isEveryoneClaimed
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-muted/60 text-muted-foreground border-border/60 hover:text-foreground'
                        )}
                      >
                        Everyone
                      </button>

                      {members.map((m) => {
                        const isClaimed =
                          item.claimedByUserIds.includes(m.userId) && !isEveryoneClaimed

                        return (
                          <button
                            key={m.userId}
                            type="button"
                            onClick={() => handleToggleClaim(item.id, m.userId)}
                            className={clsx(
                              'flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all select-none',
                              isClaimed
                                ? 'bg-primary/15 text-primary border-primary/50 font-bold scale-[1.03]'
                                : 'bg-card text-muted-foreground border-border/60 hover:text-foreground'
                            )}
                          >
                            <Avatar src={m.photoURL} name={m.displayName} size="xs" />
                            <span className="truncate max-w-[80px]">{m.displayName}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              className="w-full justify-center text-xs font-bold"
            >
              + Add Custom Line Item
            </Button>

            {/* Calculated summary per member */}
            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
              <h4 className="text-xs font-bold text-foreground">
                Itemized Shares (Proportional Tax &amp; Tip Included)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {members.map((m) => {
                  const share = computedShares[m.userId]
                  return (
                    <div
                      key={m.userId}
                      className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/50"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                        <Avatar src={m.photoURL} name={m.displayName} size="xs" />
                        <span className="font-semibold text-foreground truncate">{m.displayName}</span>
                      </div>
                      <span className="font-black text-foreground tabular-nums">
                        {formatINR(share?.totalSharePaise || 0)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Action */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button variant="outline" size="md" onClick={() => setActiveTab('text')}>
                Back to Text
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleApply}
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
                className="font-bold shadow-md shadow-primary/20"
              >
                Apply to Group Expense
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  )
}
