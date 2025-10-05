import { MemoryCache } from '../services/MemoryCache'

export const createMemoryCacheMock = (): jest.Mocked<MemoryCache> => {
  return {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    entries: jest.fn(),
  } as unknown as jest.Mocked<MemoryCache>
}
