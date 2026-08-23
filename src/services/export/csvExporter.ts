import { PersonalExpense } from '@/types/expense'
import { paiseToRupees } from '@/domain/money/money'

/**
 * Generates and triggers browser download of a CSV file for personal expenses.
 */
export function exportExpensesToCSV(expenses: PersonalExpense[], filename: string = 'oweo-expenses.csv') {
  const headers = ['Date', 'Title', 'Category', 'Amount (INR)', 'Payment Method', 'Note']

  const rows = expenses.map((e) => {
    return [
      `"${e.date}"`,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${e.category}"`,
      `"${paiseToRupees(e.amountPaise).toFixed(2)}"`,
      `"${e.paymentMethod || 'UPI'}"`,
      `"${(e.note || '').replace(/"/g, '""')}"`,
    ]
  })

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
