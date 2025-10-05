import { DiskCache } from '../services/DiskCache'

export const createDiskCacheMock = (): jest.Mocked<DiskCache> => {
  return {
    isFresh: jest.fn(),
    read: jest.fn(),
    write: jest.fn(),
  } as unknown as jest.Mocked<DiskCache>
}
