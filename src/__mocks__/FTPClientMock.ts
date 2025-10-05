import { Client } from 'basic-ftp'

export const createFtpClientMock = (): jest.Mocked<Client> => {
  return {
    access: jest.fn(),
    cd: jest.fn(),
    list: jest.fn(),
    downloadTo: jest.fn(),
    close: jest.fn(),
    ftp: { verbose: false },
  } as unknown as jest.Mocked<Client>
}
