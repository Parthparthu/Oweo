import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { PersonalExpense } from '@/types/expense'
import { formatINR } from '@/domain/money/money'
import { aggregateByCategory, calculateMonthlyMetrics } from '@/domain/analytics/analyticsEngine'
import { format } from 'date-fns'

interface PDFReportOptions {
  userName: string
  userEmail?: string | null
  expenses: PersonalExpense[]
  monthlyBudgetPaise?: number
  dateRangeLabel?: string
}

/**
 * Generates a clean, professional financial statement PDF using jsPDF and autoTable.
 */
export function generateSpendingPDFReport(options: PDFReportOptions) {
  const { userName, userEmail, expenses, monthlyBudgetPaise = 0, dateRangeLabel } = options
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageWidth = doc.internal.pageSize.getWidth()
  const nowStr = format(new Date(), 'dd MMMM yyyy, hh:mm a')
  const periodStr = dateRangeLabel || format(new Date(), 'MMMM yyyy')

  // Theme primary color (Teal #0d9488 -> RGB: 13, 148, 136)
  const primaryColor: [number, number, number] = [13, 148, 136]

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 0, pageWidth, 28, 'F')

  // Brand Name & Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Oweo', 14, 16)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Personal Financial & Spending Statement', 14, 23)

  doc.setFontSize(9)
  doc.text(`Generated: ${nowStr}`, pageWidth - 14, 16, { align: 'right' })
  doc.text(`Period: ${periodStr}`, pageWidth - 14, 23, { align: 'right' })

  // User details
  doc.setTextColor(50, 50, 50)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`Account: ${userName}`, 14, 38)
  if (userEmail) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(userEmail, 14, 43)
  }

  // Summary Metrics Calculation
  const metrics = calculateMonthlyMetrics(expenses, monthlyBudgetPaise)
  const totalSpentFormatted = formatINR(metrics.currentMonthTotalPaise)
  const budgetFormatted = monthlyBudgetPaise > 0 ? formatINR(monthlyBudgetPaise) : 'Not set'
  const dailyAvgFormatted = formatINR(metrics.dailyAveragePaise)

  // Summary Cards Box
  doc.setDrawColor(220, 225, 230)
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(14, 48, pageWidth - 28, 22, 3, 3, 'FD')

  // Card items inside box
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text('TOTAL SPENT', 20, 56)
  doc.text('MONTHLY BUDGET', 75, 56)
  doc.text('DAILY AVERAGE', 135, 56)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(13, 148, 136)
  doc.text(totalSpentFormatted, 20, 64)

  doc.setTextColor(50, 50, 50)
  doc.text(budgetFormatted, 75, 64)
  doc.text(`${dailyAvgFormatted}/day`, 135, 64)

  // Category Breakdown Table
  const categoryData = aggregateByCategory(expenses)
  const categoryRows = categoryData.map((c) => [
    c.label,
    `${c.count}`,
    `${c.percentage.toFixed(1)}%`,
    formatINR(c.totalPaise),
  ])

  const startY = 76

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20, 20, 20)
  doc.text('Category Summary', 14, startY)

  autoTable(doc, {
    startY: startY + 3,
    head: [['Category', 'Transactions', 'Share (%)', 'Amount (INR)']],
    body: categoryRows.length > 0 ? categoryRows : [['No data', '0', '0%', 'Rs 0']],
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 8.5, textColor: [40, 40, 40] },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 35, halign: 'center' },
      2: { cellWidth: 35, halign: 'center' },
      3: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  })

  // Transactions Table
  const finalY = (doc as any).lastAutoTable.finalY + 10

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20, 20, 20)
  doc.text('Detailed Transactions', 14, finalY)

  const transactionRows = expenses.slice(0, 150).map((e) => [
    e.date,
    e.title || e.category,
    e.category,
    e.paymentMethod || 'UPI',
    formatINR(e.amountPaise),
  ])

  autoTable(doc, {
    startY: finalY + 3,
    head: [['Date', 'Description', 'Category', 'Method', 'Amount']],
    body: transactionRows.length > 0 ? transactionRows : [['-', 'No expenses found', '-', '-', 'Rs 0']],
    theme: 'striped',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 65 },
      2: { cellWidth: 35 },
      3: { cellWidth: 25 },
      4: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  })

  // Footer on each page
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Oweo Financial Report • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    )
  }

  // Trigger download
  const safeFilename = `oweo-statement-${format(new Date(), 'yyyy-MM')}.pdf`
  doc.save(safeFilename)
}
