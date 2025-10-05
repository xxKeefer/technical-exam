import { MemoryCache } from './MemoryCache'

describe('MemoryCache', () => {
  let cache: MemoryCache

  beforeEach(() => {
    jest.useFakeTimers()
    cache = new MemoryCache(1000) // 1 second default TTL
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('returns null when key is missing', () => {
    expect(cache.get('missing')).toBeNull()
  })

  test('stores and retrieves a value', () => {
    cache.set('a', 'alpha')
    expect(cache.get('a')).toBe('alpha')
  })

  test('respects custom TTL', () => {
    cache.set('a', 'alpha', 500)
    jest.advanceTimersByTime(400)
    expect(cache.get('a')).toBe('alpha')
    jest.advanceTimersByTime(200)
    expect(cache.get('a')).toBeNull()
  })

  test('uses default TTL when not provided', () => {
    cache.set('a', 'alpha')
    jest.advanceTimersByTime(999)
    expect(cache.get('a')).toBe('alpha')
    jest.advanceTimersByTime(2)
    expect(cache.get('a')).toBeNull()
  })

  test('deletes a key', () => {
    cache.set('a', 'alpha')
    cache.delete('a')
    expect(cache.get('a')).toBeNull()
  })

  test('clears all keys', () => {
    cache.set('a', 'alpha')
    cache.set('b', 'bravo')
    cache.clear()
    expect(cache.get('a')).toBeNull()
    expect(cache.get('b')).toBeNull()
  })
})
