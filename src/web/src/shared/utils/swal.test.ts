import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFire } = vi.hoisted(() => ({
  mockFire: vi.fn().mockResolvedValue({ isConfirmed: true }),
}))

vi.mock('sweetalert2', () => ({
  default: {
    mixin: vi.fn(() => ({ fire: mockFire })),
  },
}))

import {
  showSuccessToast,
  showErrorToast,
  showErrorDialog,
  showSuccessDialog,
  showConfirm,
} from './swal'

beforeEach(() => {
  vi.clearAllMocks()
  mockFire.mockResolvedValue({ isConfirmed: true })
})

describe('showSuccessToast', () => {
  it('calls fire with timer 3000', () => {
    showSuccessToast('Saved!')

    expect(mockFire).toHaveBeenCalledWith(
      expect.objectContaining({ timer: 3000 }),
    )
  })
})

describe('showErrorToast', () => {
  it('calls fire with timer 4000', () => {
    showErrorToast('Oops!')

    expect(mockFire).toHaveBeenCalledWith(
      expect.objectContaining({ timer: 4000 }),
    )
  })
})

describe('showErrorDialog', () => {
  it('calls fire with icon error', () => {
    showErrorDialog('Title', 'Message')

    expect(mockFire).toHaveBeenCalledWith(
      expect.objectContaining({ icon: 'error', title: 'Title', text: 'Message' }),
    )
  })
})

describe('showSuccessDialog', () => {
  it('calls fire with icon success', () => {
    showSuccessDialog('Done', 'All good')

    expect(mockFire).toHaveBeenCalledWith(
      expect.objectContaining({ icon: 'success', title: 'Done', text: 'All good' }),
    )
  })
})

describe('showConfirm', () => {
  it('returns true when confirmed', async () => {
    mockFire.mockResolvedValueOnce({ isConfirmed: true })

    const result = await showConfirm({ title: 'Sure?' })

    expect(result).toBe(true)
  })

  it('returns false when not confirmed', async () => {
    mockFire.mockResolvedValueOnce({ isConfirmed: false })

    const result = await showConfirm({ title: 'Sure?' })

    expect(result).toBe(false)
  })

  it('uses danger styling when danger is true', async () => {
    await showConfirm({ title: 'Delete?', danger: true })

    expect(mockFire).toHaveBeenCalledWith(
      expect.objectContaining({ iconColor: '#c62828' }),
    )
  })

  it('uses custom icon and button text', async () => {
    await showConfirm({ title: 'T', text: 'D', icon: 'question', confirmButtonText: 'Go', cancelButtonText: 'No' })

    expect(mockFire).toHaveBeenCalledWith(
      expect.objectContaining({ icon: 'question', confirmButtonText: 'Go', cancelButtonText: 'No' }),
    )
  })
})
