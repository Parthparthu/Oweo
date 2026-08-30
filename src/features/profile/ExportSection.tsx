import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useCombinedExpenses } from '@/hooks/useCombinedExpenses'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToast } from '@/components/ui/Toast'
import { exportExpensesToCSV } from '@/services/export/csvExporter'
import { generateSpendingPDFReport } from '@/services/export/pdfReportGenerator'
import { SplitwiseImportModal } from './SplitwiseImportModal'
import { FileText, Table, UploadCloud } from 'lucide-react'

export const ExportSection: React.FC = () => {
  const expenses = useCombinedExpenses()
  const profile = useAuthStore((state) => state.profile)
  const user = useAuthStore((state) => state.user)
  const { showToast } = useToast()
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  const handleExportCSV = () => {
    if (expenses.length === 0) {
      showToast('No expenses to export', 'info')
      return
    }
    exportExpensesToCSV(expenses, `oweo-transactions-${new Date().toISOString().slice(0, 10)}.csv`)
    showToast('CSV downloaded successfully!', 'success')
  }

  const handleExportPDF = () => {
    if (expenses.length === 0) {
      showToast('No expenses to export in statement', 'info')
      return
    }
    setIsExportingPDF(true)
    try {
      generateSpendingPDFReport({
        userName: profile?.displayName || user?.displayName || 'User',
        userEmail: user?.email,
        expenses,
        monthlyBudgetPaise: profile?.monthlyBudgetPaise || 0,
      })
      showToast('Financial Statement PDF generated!', 'success')
    } catch (err: any) {
      showToast(err?.message || 'Failed to generate PDF', 'error')
    } finally {
      setIsExportingPDF(false)
    }
  }

  return (
    <Card className="p-5 border-border/70 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-foreground">Data Export, Import &amp; Statements</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Export your financial records or migrate your past transaction history from Splitwise
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* Import from Splitwise */}
        <Button
          onClick={() => setIsImportModalOpen(true)}
          variant="outline"
          className="justify-start h-14 p-4 font-semibold text-xs sm:text-sm border-primary/30 bg-primary/[0.03] hover:bg-primary/10"
          leftIcon={<UploadCloud className="h-5 w-5 text-primary" />}
        >
          <div className="text-left ml-1">
            <p className="font-bold text-foreground">Import from Splitwise</p>
            <p className="text-[11px] text-muted-foreground font-normal">
              Migrate past CSV records
            </p>
          </div>
        </Button>

        {/* Export CSV */}
        <Button
          onClick={handleExportCSV}
          variant="outline"
          className="justify-start h-14 p-4 font-semibold text-xs sm:text-sm border-border/80 hover:bg-muted/60"
          leftIcon={<Table className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        >
          <div className="text-left ml-1">
            <p className="font-bold text-foreground">Export CSV</p>
            <p className="text-[11px] text-muted-foreground font-normal">
              Raw transactions spreadsheet
            </p>
          </div>
        </Button>

        {/* Download PDF Statement */}
        <Button
          onClick={handleExportPDF}
          variant="outline"
          isLoading={isExportingPDF}
          className="justify-start h-14 p-4 font-semibold text-xs sm:text-sm border-border/80 hover:bg-muted/60"
          leftIcon={<FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
        >
          <div className="text-left ml-1">
            <p className="font-bold text-foreground">Download PDF</p>
            <p className="text-[11px] text-muted-foreground font-normal">
              Formatted monthly statement
            </p>
          </div>
        </Button>
      </div>

      {/* Splitwise Importer Modal */}
      <SplitwiseImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </Card>
  )
}
