import express from 'express'
import { convertStateIdsToAmoc } from './main/convertStateIdsToAmoc'
import { FloodWarningParser } from './parser/FloodWarningParser'
import { Collector } from './floods/WarningCollector'
import { MemoryCache } from './services/MemoryCache'
import { DiskCache } from './services/DiskCache'
import { Client } from 'basic-ftp'

require('./main/log.ts')

const app = express()
const port = 3000

const memoryCache = new MemoryCache()
const diskCache = new DiskCache()
const client = new Client()

app.get('/', async (req, res) => {
  const stateQuery = req.query.state?.toString() ?? ''
  const state = convertStateIdsToAmoc(stateQuery)
  const downloader = new Collector({ memoryCache, diskCache, client })

  try {
    const data = await downloader.getAllWarns()

    const results = data
      .filter((file) => file.startsWith(state))
      .map((file) => file.replace(/\.amoc\.xml/, ''))

    res.send(results)
  } catch (error) {
    console.error(`Error fetching warning list for state "${stateQuery}":`, error)
    res.status(500).json({
      error: 'Failed to retrieve warning list. Please try again later.',
    })
  } finally {
    downloader.close()
  }
})

app.get('/warning/:id', async (req, res) => {
  const amocRegion = req.params.id
  const downloader = new Collector({ memoryCache, diskCache, client })
  try {
    const warning = await downloader.downloadWarning(`${amocRegion}.amoc.xml`)
    const text = await downloader.downloadWarning(`${amocRegion}.txt`)

    const warningParser = new FloodWarningParser(warning, text)
    const parsedWarning = await warningParser.getWarning()

    res.send(parsedWarning)
  } catch (error) {
    console.error(`Error fetching or parsing warning "${amocRegion}":`, error)
    res.status(500).json({
      error: `Failed to retrieve or parse warning for region "${amocRegion}". Please try again later.`,
    })
  } finally {
    downloader.close()
  }
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
