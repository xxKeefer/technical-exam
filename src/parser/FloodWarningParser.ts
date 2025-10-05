import { parseXmlString } from './parseXmlString'

interface ParsedAMOC {
  amoc: AMOC
}

interface AMOC {
  source: AMOCSource[]
  identifier: string[]
  'issue-time-utc': string[]
  'expiry-time': string[]
  service: string[]
  'product-type': string[]
}

interface AMOCSource {
  sender: string[]
  region: string[]
  office: string[]
  copyright: string[]
  disclaimer: string[]
}

export class FloodWarningParser {
  private xml: string
  private parsedXml: ParsedAMOC | null = null
  private text: string
  constructor(xml: string, text: string) {
    this.xml = xml
    this.text = text
  }

  private async getParsedXml(): Promise<AMOC | null> {
    if (this.parsedXml) {
      return this.parsedXml.amoc // Return cached result
    }

    this.parsedXml = await new Promise((resolve, reject) => {
      parseXmlString(this.xml, (data) => {
        resolve(data)
      })
    })

    return this.parsedXml?.amoc ?? null
  }

  async getWarning() {
    const amoc = await this.getParsedXml()

    if (!amoc) return null

    let productType = parseProductType(amoc)
    let service = getService(amoc)

    return {
      productType,
      service,
      start: await this.getIssueTime(),
      expiry: await this.getEndTime(),
      text: this.text,
    }
  }
  async getIssueTime() {
    const amoc = await this.getParsedXml()
    if (!amoc) return null
    return amoc['issue-time-utc'][0]
  }

  async getEndTime() {
    const amoc = await this.getParsedXml()

    if (!amoc) return null

    return amoc['expiry-time'][0]
  }
}
function getService(amoc: AMOC) {
  let service = amoc['service'][0]

  switch (service) {
    case 'COM':
      service = 'Commercial Services'
      break
    case 'HFW':
      service = 'Flood Warning Service'
      break
    case 'TWS':
      service = 'Tsunami Warning Services'
      break
    case 'WAP':
      service = 'Analysis and Prediction'
      break
    case 'WSA':
      service = 'Aviation Weather Services'
      break
    case 'WSD':
      service = 'Defence Weather Services'
      break
    case 'WSF':
      service = 'Fire Weather Services'
      break
    case 'WSM':
      service = 'Marine Weather Services'
      break
    case 'WSP':
      service = 'Public Weather Services'
      break
    case 'WSS':
      service = 'Cost Recovery Services'
      break
    case 'WSW':
      service = 'Disaster Mitigation'
      break
  }
  return service
}

function parseProductType(amoc: AMOC) {
  let productType = amoc['product-type'][0]

  switch (productType) {
    case 'A':
      productType = 'Advice'
    case 'B':
      productType = 'Bundle'
    case 'C':
      productType = 'Climate'
    case 'D':
      productType = 'Metadata'
    case 'E':
      productType = 'Analysis'
    case 'F':
      productType = 'Forecast'
    case 'M':
      productType = 'Numerical Weather Prediction'
    case 'O':
      productType = 'Observation'
    case 'Q':
      productType = 'Reference'
    case 'R':
      productType = 'Radar'
    case 'S':
      productType = 'Special'
    case 'T':
      productType = 'Satellite'
    case 'W':
      productType = 'Warning'
    case 'X':
      productType = 'Mixed'
  }
  return productType
}
