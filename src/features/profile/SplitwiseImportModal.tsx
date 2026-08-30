import React, { useState, useRef } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToast } from '@/components/ui/Toast'
import { formatINR } from '@/domain/money/money'
import {
  parseSplitwiseCSV,
  SplitwiseImportPreview,
} from '@/domain/importers/splitwiseParser'
import {
  UploadCloud,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export const SplitwiseImportModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const user = useAuthStore((state) => state.user)
  const createExpense = useExpenseStore((state) => state.createExpense)
  const { showToast } = useToast()

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<SplitwiseImportPreview | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [error, setError] = useState('')

  const handleReset = () => {
    setFile(null)
    setPreview(null)
    setIsImporting(false)
    setImportProgress(0)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = () => {
    if (isImporting) return
    handleReset()
    onClose()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a valid Splitwise .csv export file')
      return
    }

    setFile(selectedFile)
    setError('')

    try {
      const text = await selectedFile.text()
      const result = parseSplitwiseCSV(text)
      if (result.errors.length > 0 && result.validExpenses.length === 0) {
        setError(result.errors.join(' '))
      } else {
        setPreview(result)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to read CSV file')
    }
  }

  const handleConfirmImport = async () => {
    if (!preview || !user || isImporting) return

    setIsImporting(true)
    setImportProgress(0)
    setError('')

    const total = preview.validExpenses.length
    let imported = 0

    try {
      // Chunk processing to maintain UI responsiveness
      for (const item of preview.validExpenses) {
        await createExpense({
          userId: user.uid,
          title: item.title,
          amountPaise: item.userSharePaise,
          category: item.category,
          date: item.date,
          paymentMethod: 'UPI',
          note: item.groupName ? `Imported from Splitwise (${item.groupName})` : 'Imported from Splitwise',
        })

        imported++
        setImportProgress(Math.round((imported / total) * 100))
      }

      showToast(
        `Successfully imported ${imported} expenses (${formatINR(preview.totalVolumePaise)}) from Splitwise!`,
        'success',
        5000
      )
      handleClose()
    } catch (err: any) {
      setError(err?.message || 'Failed during import')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Splitwise Export (CSV)"
      description="Migrate your past spending history and group expenses seamlessly"
    >
      <div className="space-y-4 pt-1">
        {!preview ? (
          /* Step 1: Upload CSV Area */
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border/80 hover:border-primary/50 bg-muted/20 hover:bg-muted/40 transition-colors rounded-2xl p-8 text-center cursor-pointer space-y-3 select-none"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  {file ? file.name : 'Choose Splitwise CSV Export'}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Export from Splitwise Settings &rarr; Export as CSV &rarr; Upload here
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        ) : (
          /* Step 2: Interactive Preview Before Mutation */
          <div className="space-y-4">
            {/* Preview Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl bg-card border border-border/70 text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Transactions
                </span>
                <p className="text-base font-black text-foreground">
                  {preview.validExpenses.length}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-card border border-border/70 text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Total Volume
                </span>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  {formatINR(preview.totalVolumePaise)}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-card border border-border/70 text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Groups
                </span>
                <p className="text-base font-black text-primary">
                  {preview.detectedGroups.length}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-card border border-border/70 text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Span
                </span>
                <p className="text-[11px] font-bold text-muted-foreground truncate mt-1">
                  {preview.dateRange.start} &rarr; {preview.dateRange.end}
                </p>
              </div>
            </div>

            {/* Detected groups tags */}
            {preview.detectedGroups.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground">Groups:</span>
                {preview.detectedGroups.map((g) => (
                  <span
                    key={g}
                    className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold border border-primary/20"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Preview list */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto overscroll-contain pr-1 border-t border-b border-border/60 py-2">
              {preview.validExpenses.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/50 text-xs"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="font-bold text-foreground truncate">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {item.date} • {item.category}
                      {item.groupName ? ` • ${item.groupName}` : ''}
                    </p>
                  </div>
                  <span className="font-extrabold text-foreground tabular-nums shrink-0">
                    {formatINR(item.userSharePaise)}
                  </span>
                </div>
              ))}
              {preview.validExpenses.length > 8 && (
                <p className="text-center text-[11px] text-muted-foreground pt-1 italic">
                  + {preview.validExpenses.length - 8} more transactions ready to import
                </p>
              )}
            </div>

            {/* Progress bar when importing */}
            {isImporting && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs font-bold text-foreground">
                  <span>Importing into Oweo...</span>
                  <span>{importProgress}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={handleReset}
                disabled={isImporting}
              >
                Choose Different File
              </Button>
              <Button
                variant="primary"
                size="md"
                isLoading={isImporting}
                onClick={handleConfirmImport}
                leftIcon={<Sparkles className="h-4 w-4" />}
                className="font-bold shadow-md shadow-primary/20"
              >
                Confirm &amp; Import ({preview.validExpenses.length})
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  )
}
