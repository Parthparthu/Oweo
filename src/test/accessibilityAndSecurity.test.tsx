import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Dialog } from '@/components/ui/Dialog'
import { Sheet } from '@/components/ui/Sheet'
import { AmountInput } from '@/components/ui/AmountInput'

describe('Accessibility & UI Modal Focus Tests', () => {
  it('renders Dialog with accessible dialog role and title', () => {
    const onClose = vi.fn()
    render(
      <Dialog isOpen={true} onClose={onClose} title="Test Modal" description="Modal description">
        <button type="button">Action Button</button>
      </Dialog>
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeDefined()
    expect(screen.getByText('Test Modal')).toBeDefined()
    expect(screen.getByText('Modal description')).toBeDefined()
  })

  it('triggers onClose when Escape key is pressed in Dialog', () => {
    const onClose = vi.fn()
    render(
      <Dialog isOpen={true} onClose={onClose} title="Escape Test">
        <button type="button">Inside Button</button>
      </Dialog>
    )

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('renders Sheet with accessible dialog role and close button', () => {
    const onClose = vi.fn()
    render(
      <Sheet isOpen={true} onClose={onClose} title="Sheet Test">
        <button type="button">Save Sheet</button>
      </Sheet>
    )

    const sheet = screen.getByRole('dialog')
    expect(sheet).toBeDefined()
    expect(screen.getByLabelText('Close sheet')).toBeDefined()
  })

  it('AmountInput adds quick amount chips using exact paise arithmetic', () => {
    const onChange = vi.fn()
    render(<AmountInput value="10.50" onChange={onChange} showQuickChips={true} />)

    const chip50 = screen.getByText('+50')
    fireEvent.click(chip50)

    // 10.50 + 50 = 60.50 (exact string 60.50)
    expect(onChange).toHaveBeenCalledWith('60.50')
  })

  it('AmountInput input field includes accessible aria-label', () => {
    render(<AmountInput value="100" onChange={vi.fn()} />)
    const input = screen.getByLabelText(/Expense amount in rupees/i)
    expect(input).toBeDefined()
  })
})
