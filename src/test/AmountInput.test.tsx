import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AmountInput } from '@/components/ui/AmountInput'

describe('AmountInput Component', () => {
  it('renders correctly with placeholder and rupee symbol', () => {
    render(<AmountInput value="" onChange={() => {}} placeholder="0" />)
    expect(screen.getByText('₹')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('0')).toBeInTheDocument()
  })

  it('handles numeric input and filters non-numeric characters', () => {
    const onChange = vi.fn()
    render(<AmountInput value="180" onChange={onChange} />)

    const input = screen.getByDisplayValue('180')
    fireEvent.change(input, { target: { value: '180.50' } })
    expect(onChange).toHaveBeenCalledWith('180.50')
  })

  it('increments amount when quick chips (+100, +500) are clicked', () => {
    const onChange = vi.fn()
    render(<AmountInput value="100" onChange={onChange} showQuickChips={true} />)

    const chip500 = screen.getByText('+500')
    fireEvent.click(chip500)
    expect(onChange).toHaveBeenCalledWith('600')
  })
})
