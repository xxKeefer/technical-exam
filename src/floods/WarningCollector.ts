import { Client, FileInfo } from 'basic-ftp'
import { Writable } from 'stream'
import { DiskCache } from '../services/DiskCache'
import { MemoryCache } from '../services/MemoryCache'

export interface CollectorOptions {
  diskCache: DiskCache
  memoryCache: MemoryCache
  client: Client
}

export class Collector {
  private disk: DiskCache
  private cache: MemoryCache
  private client: Client
  private connected = false

  constructor({ client, diskCache, memoryCache }: CollectorOptions) {
    this.disk = diskCache
    this.cache = memoryCache
    this.client = client
  }

  private async connect() {
    if (this.connected && this.client) return this.client

    this.client.ftp.verbose = false
    await this.client.access({
      host: 'ftp.bom.gov.au',
      secure: false,
    })
    await this.client.cd('/anon/gen/fwo/')
    this.connected = true
    return this.client
  }

  async close() {
    if (this.client) {
      this.client.close()
      this.connected = false
    }
  }

  async getAllWarns(): Promise<string[]> {
    const client = await this.connect()
    const files: FileInfo[] = await client.list()
    return files.filter((f) => f.name.endsWith('.amoc.xml')).map((f) => f.name)
  }

  async downloadWarning(file: string, ttlMs = 10 * 60 * 1000) {
    const inMemory = this.cache.get(file)
    if (inMemory) {
      console.log(`Memory cache hit for ${file}`)
      return inMemory
    }

    if (await this.disk.isFresh(file, ttlMs)) {
      console.log(`Disk cache hit for ${file}`)
      const buffer = await this.disk.read(file)
      if (buffer) {
        const parsed = buffer.toString('utf8')
        this.cache.set(file, parsed, ttlMs)
        return parsed
      }
    }

    console.log(`Downloading ${file} from FTP...`)
    const client = await this.connect()
    client.ftp.verbose = false

    await client.access({
      host: 'ftp.bom.gov.au',
      secure: false,
    })

    await client.cd('/anon/gen/fwo/')

    const chunks: Buffer[] = []

    const writable = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.from(chunk))
        callback()
      },
    })
    await client.downloadTo(writable, file)
    const buffer = Buffer.concat(chunks)
    this.disk.write(file, buffer)
    const parsed = buffer.toString('utf8')
    this.cache.set(file, parsed, ttlMs)
    console.log(`Downloaded ${file}`)
    return parsed
  }
}
