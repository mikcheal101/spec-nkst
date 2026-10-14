import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useApi } from './useApi'

describe('useApi', () => {
  it('starts with idle state', () => {
    const { result } = renderHook(() => useApi<string>())

    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('sets loading during execution', async () => {
    const { result } = renderHook(() => useApi<string>())

    const p = Promise.resolve({ data: 'hello' })
    const apiCall = vi.fn().mockReturnValue(p)

    act(() => { result.current.execute(apiCall) })

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBe('hello')
  })

  it('handles successful response', async () => {
    const { result } = renderHook(() => useApi<string>())

    await act(async () => {
      const data = await result.current.execute(() => Promise.resolve({ data: 'success' }))
      expect(data).toBe('success')
    })

    expect(result.current.data).toBe('success')
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('handles error response', async () => {
    const { result } = renderHook(() => useApi<string>())

    await act(async () => {
      const data = await result.current.execute(() => Promise.resolve({ error: 'Something went wrong' }))
      expect(data).toBeNull()
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe('Something went wrong')
    expect(result.current.loading).toBe(false)
  })

  it('sets data to null when response has no data field', async () => {
    const { result } = renderHook(() => useApi<string>())

    await act(async () => {
      await result.current.execute(() => Promise.resolve({}))
    })

    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('reset clears state', async () => {
    const { result } = renderHook(() => useApi<string>())

    await act(async () => {
      await result.current.execute(() => Promise.resolve({ data: 'hello' }))
    })

    expect(result.current.data).toBe('hello')

    act(() => { result.current.reset() })

    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })
})
