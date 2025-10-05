// AMOC: Australian Meteorological and Oceanographic Codes

export function convertStateIdsToAmoc(state: string): string {
  switch (state.toLocaleLowerCase()) {
    case 'nt':
      return 'IDD'
    case 'nsw':
      return 'IDN'
    case 'qld':
      return 'IDQ'
    case 'sa':
      return 'IDS'
    case 'tas':
      return 'IDT'
    case 'vic':
      return 'IDV'
    case 'wa':
      return 'IDW'
    case 'act':
      return 'IDN'
  }

  return 'unk'
}
