import { Client } from '../Client'
import { env } from '../env'

export class WhatsAppClientManager {
  client: Client
  qr: string | null
  ready: boolean
  apiReady: boolean

  constructor(client: Client) {
    this.client = client
    this.ready = false
    this.apiReady = false
    this.qr = null
    this.client.on('qr', (qr) => {
      console.log('qr', qr)
      this.qr = qr
      this.ready = false
      this.apiReady = true
    })
    this.client.on('ready', () => {
      this.qr = null
      this.ready = true
      this.apiReady = true
    })
    this.client.on('disconnected', () => {
      console.log('desconectado')
      this.ready = false
      this.apiReady = false
      this.qr = null
    })
    this.client.on('Loading', () => {
      console.log('loading screen')
    })
    this.client.initialize()
  }

  static async create() {
    const client = await Client.create({
      headless: env.NODE_ENV === 'development' ? false : 'new',
    })
    if (client) {
      return new WhatsAppClientManager(client)
    }
  }
}

export async function initializeWhatsappClient() {
  try {
    const whatsappClient = await WhatsAppClientManager.create()
    return whatsappClient
  } catch (err) {
    console.error('Erro ao inicializar o cliente do whatsapp', err)
    throw err
  }
}
