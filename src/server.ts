import fastify from 'fastify'
import cors from '@fastify/cors'
import { env } from './env'
import { join } from 'node:path'
import fastifyStatic from '@fastify/static'

import { instanceRoutes } from './routes/instance.route'
import { statusRoutes } from './routes/status.routes'
import fastifyWebsocket from '@fastify/websocket'
import { Client } from './Client'

export const app = fastify()

const whatsappClients = {}

app.decorate('whatsappClients', whatsappClients)

app.register(cors, {
  origin: true,
})

app.register(fastifyWebsocket)

app.register(fastifyStatic, {
  root: join(__dirname, '..', 'public'),
  prefix: '/public/',
})

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
