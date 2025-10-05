import { Writable } from 'stream'
import { createDiskCacheMock } from '../__mocks__/DiskCacheMock'
import { createMemoryCacheMock } from '../__mocks__/MemoryCacheMock'
import { createFtpClientMock } from '../__mocks__/FTPClientMock'
import { Collector } from './WarningCollector'

describe('Collector', () => {
  let diskMock: ReturnType<typeof createDiskCacheMock>
  let memMock: ReturnType<typeof createMemoryCacheMock>
  let clientMock: ReturnType<typeof createFtpClientMock>
  let collector: Collector

  beforeEach(() => {
    diskMock = createDiskCacheMock()
    memMock = createMemoryCacheMock()
    clientMock = createFtpClientMock()
    jest.clearAllMocks()

    collector = new Collector({
      diskCache: diskMock,
      memoryCache: memMock,
      client: clientMock,
    })
  })

  // --------------------- getAllWarns ---------------------

  it('filters .amoc.xml files', async () => {
    clientMock.list.mockResolvedValue([
      { name: 'foo.txt' },
      { name: 'bar.amoc.xml' },
      { name: 'baz.amoc.xml' },
    ] as any)

    const result = await collector.getAllWarns()
    expect(result).toEqual(['bar.amoc.xml', 'baz.amoc.xml'])
    expect(clientMock.access).toHaveBeenCalled()
    expect(clientMock.cd).toHaveBeenCalledWith('/anon/gen/fwo/')
  })

  // --------------------- downloadWarning ---------------------

  it('returns value from memory cache', async () => {
    memMock.get.mockReturnValue('cached')
    const result = await collector.downloadWarning('file.xml')
    expect(result).toBe('cached')
    expect(diskMock.isFresh).not.toHaveBeenCalled()
    expect(clientMock.downloadTo).not.toHaveBeenCalled()
  })

  it('returns value from disk cache if memory miss', async () => {
    memMock.get.mockReturnValue(null)
    diskMock.isFresh.mockResolvedValue(true)
    diskMock.read.mockResolvedValue(Buffer.from('disk data'))

    const result = await collector.downloadWarning('file.xml', 500)
    expect(result).toBe('disk data')
    expect(memMock.set).toHaveBeenCalledWith('file.xml', 'disk data', 500)
  })

  it('downloads from FTP if not cached', async () => {
    memMock.get.mockReturnValue(null)
    diskMock.isFresh.mockResolvedValue(false)

    // simulate FTP download via Writable
    clientMock.downloadTo.mockImplementation(
      async (destination: string | Writable, remotePath: string) => {
        if (destination instanceof Writable) {
          destination.write(Buffer.from('ftp data'))
          destination.end()
        }
        return {} as any
      }
    )

    const result = await collector.downloadWarning('file.xml', 1000)
    expect(result).toBe('ftp data')
    expect(diskMock.write).toHaveBeenCalledWith('file.xml', Buffer.from('ftp data'))
    expect(memMock.set).toHaveBeenCalledWith('file.xml', 'ftp data', 1000)
  })

  it('closes FTP client even on download error', async () => {
    memMock.get.mockReturnValue(null)
    diskMock.isFresh.mockResolvedValue(false)

    clientMock.downloadTo.mockRejectedValue(new Error('network fail'))

    await expect(collector.downloadWarning('file.xml')).rejects.toThrow('network fail')
  })
})
