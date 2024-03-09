import { FastifyInstance } from 'fastify'

export async function localizacaoRoutes(app: FastifyInstance) {
  app.get('/localizacao', { websocket: true }, async (connection, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`)
    const domain = url.pathname.split('/').pop()

    if (!domain) {
      const response = {
        type: 'error',
        message: 'Dominio não fornecido',
        errorNumber: 100,
      }
      connection.socket.send(JSON.stringify(response))
      connection.end()
    }

    connection.socket.on('message', (message) => {
      console.log(message)
    })

    connection.socket.on('open', () => {
      console.log('Conectou')
    })
  })
}
