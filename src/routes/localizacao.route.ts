import { FastifyInstance } from 'fastify'

export async function localizacaoRoutes(app: FastifyInstance) {
  const salas = {} as any

  app.get('/', { websocket: true }, async (connection, req) => {
    connection.socket.on('message', (message) => {
      const data = JSON.parse(message.toString())
      console.log({ data })

      if (data.type) {
        if (data.type === 'JOIN') {
          const salaId = data.salaId
          if (!salas[salaId]) {
            salas[salaId] = new Set()
          }
          salas[salaId].add(connection.socket)
          connection.socket.salaId = salaId
        }
      } else {
        const sala = connection.socket.salaId
        if (sala && salas[sala]) {
          salas[sala].forEach((client) => {
            if (client.readyState === connection.socket.OPEN) {
              client.send(JSON.stringify(data))
            }
          })
        }
      }

      // const data = message.toString()
      connection.socket.send(data)
    })
  })
}
