import { FastifyInstance } from 'fastify'

export async function localizacaoRoutes(app: FastifyInstance) {
  app.get('/', { websocket: true }, async (connection, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`)
    const domain = url.pathname.split('/').pop()

    connection.socket.on('message', (message) => {
      console.log(message)
    })

    connection.socket.on('open', () => {
      console.log('conectou')
    })
  })
}
