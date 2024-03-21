import { FastifyInstance } from 'fastify'

export async function localizacaoRoutes(app: FastifyInstance) {
  const salas = {} as any

  app.get('/', { websocket: true }, async (connection, req) => {
    connection.socket.on('message', (message) => {
      const data = JSON.parse(message.toString().replaceAll("'", '"'))

      if (data.type) {
        if (data.type === 'JOIN') {
          console.log('entrou no join')
          console.log({ data })

          const salaId = data.salaId
          if (!salas[salaId]) {
            salas[salaId] = new Set()
          }
          salas[salaId].add(connection.socket)
          connection.socket.salaId = salaId
        } else if (data.type === 'LOCALIZATION') {
          const { salaId } = data
          if (!salas[salaId]) {
            salas[salaId] = new Set()
          }
          salas[salaId].forEach((client) => {
            if (client.readyState === connection.socket.OPEN) {
              client.send(JSON.stringify(data))
            }
          })
        }
      }
    })
  })
}
