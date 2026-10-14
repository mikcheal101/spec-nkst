import { describe, it, expect } from 'vitest'
import { unwrap } from './useApi'

describe('unwrap', () => {
  it('returns data on success', async () => {
    const result = await unwrap(Promise.resolve({ data: 'hello' }))
    expect(result).toBe('hello')
  })

  it('throws on error', async () => {
    await expect(unwrap(Promise.resolve({ error: 'fail' }))).rejects.toThrow('fail')
  })

  it('returns data when it is an object', async () => {
    const obj = { id: 1, name: 'test' }
    const result = await unwrap(Promise.resolve({ data: obj }))
    expect(result).toEqual(obj)
  })

  it('throws on missing data with error message', async () => {
    await expect(unwrap(Promise.resolve({ error: 'Not found' }))).rejects.toThrow('Not found')
  })
})
