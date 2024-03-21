import { FastifyInstance } from 'fastify'

export async function localizacaoRoutes(app: FastifyInstance) {
  app.get('/', { websocket: true }, async (connection, req) => {
    connection.socket.on('message', (message) => {
      const data = message.toString()
      connection.socket.send(data)
    })

    connection.socket.on('open', () => {
      console.log('conectou')
    })
  })
}
