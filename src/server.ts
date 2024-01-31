import fastify from 'fastify'
import cors from '@fastify/cors'
import { env } from './env'

import { instanceRoutes } from './routes/instance.route'
import { statusRoutes } from './routes/status.routes'
import fastifyWebsocket from '@fastify/websocket'
import { initializeWhatsappClient } from './services/whatsappClientService'

export const app = fastify()

console.log('oiew')

initializeWhatsappClient()
  .then((whatsappClient) => {
    app.decorate('whatsappClient', whatsappClient)

    app.register(cors, {
      origin: true,
    })

    app.register(fastifyWebsocket)

    app.register(instanceRoutes, {
      prefix: '/instance',
    })

    app.register(statusRoutes, {
      prefix: '/status',
    })

    const host = env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'

    app
      .listen({
        host,
        port: env.PORT,
      })
      .then(() => {
        console.log(`HTTP server listening on ${env.PORT}`)
      })
  })
  .catch((err) => {
    console.error('Erro ao inicializar o cliente do whatsapp', err)
    process.exit(1)
  })
