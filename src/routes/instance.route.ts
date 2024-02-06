import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { checkApiIsReady } from '../middlewares/check-api-is-ready'

export async function instanceRoutes(app: FastifyInstance) {
  app.post(
    '/message',
    {
      preHandler: [checkApiIsReady],
    },
    async (req: FastifyRequest, res: FastifyReply) => {
      console.log(req.body)
      try {
        const schema = z.object({
          message: z.string(),
          number: z.string(),
        })

        const { message, number } = schema.parse(req.body)

        const sendedMessage = await app.whatsappClient.client.sendMessage(
          `${number}@c.us`,
          message,
        )

        res.send(sendedMessage)
      } catch (error) {
        console.log(error)
        res.send({
          type: 'error',
          message: error,
          errorNumber: 304,
        })
      }
    },
  )

  app.post(
    '/groups',
    {
      preHandler: [checkApiIsReady],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const schema = z.object({
          message: z.string(),
          nomeGrupo: z.string().array(),
        })

        console.log(request.body)

        const { message, nomeGrupo } = schema.parse(request.body)

        if (nomeGrupo.length < 1) {
          reply.send({
            type: 'error',
            message: 'Nenhum grupo encontrado , verifique os nomes',
            errorNumber: '302',
          })
        }

        const groups = await app.whatsappClient.client.getGroups()

        for (const name of nomeGrupo) {
          console.log('for: ', name)
          const group = groups.find((grp) => grp.name === name)
          console.log('group: ', group)
          if (group) {
            await group.sendMessage(message)
          }
        }

        reply.code(200).send()
      } catch (error: any) {
        console.log(error)
        reply.send({
          type: 'error',
          message: error.message,
          code: error.code,
          errorNumber: 304,
        })
      }
    },
  )

  app.get('/qr', { websocket: true }, async (connection) => {
    if (app.whatsappClient.qr) {
      connection.socket.send(app.whatsappClient.qr)
    }

    app.whatsappClient.client.on('qr', (qr) => {
      connection.socket.send(qr)
    })
    app.whatsappClient.client.on('ready', () => {
      connection.socket.send('ready')
    })
  })

  app.get(
    '/connected',
    {
      preHandler: [checkApiIsReady],
    },
    async (_, res: FastifyReply) => {
      res.send({
        status: 'ok',
      })
    },
  )

  app.get('/screen', async (request: FastifyRequest, reply: FastifyReply) => {
    const { filename } = request.query

    if (!filename) {
      return reply.code(400).send('Nome do arquivo não fornecido')
    }

    return reply.sendFile(`${filename}.png`)
  })

  app.get(
    '/disconnect',
    {
      preHandler: [checkApiIsReady],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await app.whatsappClient.client.disconnect()

      reply.code(200).send()
    },
  )
}
