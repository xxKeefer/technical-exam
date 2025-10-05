export class MemoryCache {
  private cache = new Map<string, { value: string; expiresAt: number }>()
  private defaultTtlMs: number

  constructor(defaultTtlMs = 10 * 60 * 1000) {
    this.defaultTtlMs = defaultTtlMs
  }

  get(key: string): string | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.value
  }

  set(key: string, value: string, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs)
    this.cache.set(key, { value, expiresAt })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }
}
