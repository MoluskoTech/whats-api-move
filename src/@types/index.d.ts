import { Client } from '../Client'
import { WhatsAppClientManager } from '../services/whatsappClientService'

declare global {
  interface Window {
    Store: any
    WWebJS: any
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    whatsappClients: {
      [domain: string]: WhatsAppClientManager
    }
  }
}

export {}
