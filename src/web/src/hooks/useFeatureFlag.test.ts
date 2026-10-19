import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFeatureFlag } from '../../../mobile/featureFlags'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useFeatureFlag hook', () => {
  it('returns loading state initially', () => {
    const { result } = renderHook(() => useFeatureFlag('test-key'))
    expect(result.current.isLoading).toBe(true)
    expect(result.current.state).toBeNull()
  })

  it('can be called with a key', () => {
    const { result } = renderHook(() => useFeatureFlag('nkst.features.memberSelfService'))
    expect(result.current.state).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })
})