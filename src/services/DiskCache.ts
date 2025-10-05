import fs from 'fs/promises'
import path from 'path'

export class DiskCache {
  private cacheDir: string
  private defaultTtlMs: number

  constructor(cacheDir = './cache', defaultTtlMs = 10 * 60 * 1000) {
    this.cacheDir = cacheDir
    this.defaultTtlMs = defaultTtlMs
  }

  private getCachePath(key: string) {
    return path.join(this.cacheDir, key)
  }

  async ensureCacheDir() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true })
    } catch (err) {
      console.warn('Failed to create cache directory:', err)
    }
  }

  async isFresh(key: string, ttlMs?: number): Promise<boolean> {
    const cachePath = this.getCachePath(key)
    try {
      const stats = await fs.stat(cachePath)
      const ageMs = Date.now() - stats.mtimeMs
      return ageMs < (ttlMs ?? this.defaultTtlMs)
    } catch {
      return false
    }
  }

  async read(key: string): Promise<Buffer | null> {
    const cachePath = this.getCachePath(key)
    try {
      return await fs.readFile(cachePath)
    } catch {
      return null
    }
  }

  async write(key: string, data: Buffer): Promise<void> {
    const cachePath = this.getCachePath(key)
    await this.ensureCacheDir()
    await fs.writeFile(cachePath, Buffer.from(data))
  }
}
