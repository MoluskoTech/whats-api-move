import { Client } from '../Client'
import { WhatsAppClientManager } from '../services/whatsappClientService'
import * as WebSocket from 'ws'

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
