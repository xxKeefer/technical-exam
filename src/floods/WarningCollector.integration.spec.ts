import { Client } from 'basic-ftp'
import { createDiskCacheMock } from '../__mocks__/DiskCacheMock'
import { createMemoryCacheMock } from '../__mocks__/MemoryCacheMock'
import { Collector } from './WarningCollector'

describe('getting data', () => {
  let diskMock = createDiskCacheMock()
  let memMock = createMemoryCacheMock()

  const client = new Client()

  const collector = new Collector({ client, memoryCache: memMock, diskCache: diskMock })
  it('should download data', async () => {
    const warnings = await collector.getAllWarns()
    collector.close()

    expect(warnings.length).toBeGreaterThan(1)
  })

  it('should download data', async () => {
    const warnings = await collector.getAllWarns()
    collector.close()

    expect(warnings).toContain('IDQ11307.amoc.xml')
  })
})
