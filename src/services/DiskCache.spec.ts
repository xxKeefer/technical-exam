import fs from 'fs/promises'
import path from 'path'
import { DiskCache } from './DiskCache'

jest.mock('fs/promises')

describe('DiskCache', () => {
  const mockedFs = jest.mocked(fs)
  const cacheDir = './test-cache'
  let disk: DiskCache

  beforeEach(() => {
    jest.clearAllMocks()
    disk = new DiskCache(cacheDir, 1000) // default TTL = 1s
  })

  describe('ensureCacheDir', () => {
    it('creates the cache directory recursively', async () => {
      await disk.ensureCacheDir()
      expect(mockedFs.mkdir).toHaveBeenCalledWith(cacheDir, { recursive: true })
    })

    it('logs a warning if mkdir fails', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      mockedFs.mkdir.mockRejectedValueOnce(new Error('mkdir failed'))
      await disk.ensureCacheDir()
      expect(warnSpy).toHaveBeenCalledWith('Failed to create cache directory:', expect.any(Error))
      warnSpy.mockRestore()
    })
  })

  describe('isFresh', () => {
    it('returns true if file is within TTL', async () => {
      mockedFs.stat.mockResolvedValueOnce({ mtimeMs: Date.now() - 500 } as any)
      const result = await disk.isFresh('file.txt')
      expect(result).toBe(true)
      expect(mockedFs.stat).toHaveBeenCalledWith(path.join(cacheDir, 'file.txt'))
    })

    it('returns false if file is older than TTL', async () => {
      mockedFs.stat.mockResolvedValueOnce({ mtimeMs: Date.now() - 2000 } as any)
      const result = await disk.isFresh('file.txt')
      expect(result).toBe(false)
    })

    it('returns false if stat throws (file missing)', async () => {
      mockedFs.stat.mockRejectedValueOnce(new Error('ENOENT'))
      const result = await disk.isFresh('missing.txt')
      expect(result).toBe(false)
    })

    it('respects custom TTL', async () => {
      mockedFs.stat.mockResolvedValueOnce({ mtimeMs: Date.now() - 1500 } as any)
      const result = await disk.isFresh('file.txt', 2000)
      expect(result).toBe(true)
    })
  })

  describe('read', () => {
    it('returns file contents as buffer', async () => {
      const fakeBuffer = Buffer.from('data')
      mockedFs.readFile.mockResolvedValueOnce(fakeBuffer)
      const result = await disk.read('file.txt')
      expect(result).toEqual(fakeBuffer)
      expect(mockedFs.readFile).toHaveBeenCalledWith(path.join(cacheDir, 'file.txt'))
    })

    it('returns null if file cannot be read', async () => {
      mockedFs.readFile.mockRejectedValueOnce(new Error('read error'))
      const result = await disk.read('missing.txt')
      expect(result).toBeNull()
    })
  })

  describe('write', () => {
    it('ensures cache directory and writes file', async () => {
      const ensureSpy = jest.spyOn(disk, 'ensureCacheDir').mockResolvedValue()
      const data = Buffer.from('hello')
      await disk.write('file.txt', data)
      expect(ensureSpy).toHaveBeenCalled()
      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        path.join(cacheDir, 'file.txt'),
        Buffer.from(data)
      )
    })
  })
})
