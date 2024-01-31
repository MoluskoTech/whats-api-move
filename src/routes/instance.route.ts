import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import fs from 'node:fs'
import { checkApiIsReady } from '../middlewares/check-api-is-ready'
import { join } from 'node:path'

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
      console.log(request.body)
      try {
        const schema = z.object({
          message: z.string(),
          nomeGrupo: z.string(),
        })

        const { message, nomeGrupo } = schema.parse(request.body)

        const chats = await app.whatsappClient.client.getChats()

        const groups = chats.filter((chat) => chat.isGroup)

        const group = groups.find((grp) => grp.name === nomeGrupo)

        if (group) {
          await group.sendMessage(message)
          reply.code(200).send()
          return
        }

        reply.send({
          type: 'error',
          message: 'Grupo não encontrado, verifique o nome',
          errorNumber: '302',
        })
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
    const filePath = join(__dirname, '..', '..', 'example.png')
    console.log(filePath)

    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        reply.code(404).send('Arquivo não encontrado')
        return
      }

      reply.header('Content-Disposition', 'attachment; filename=' + filePath)
      reply.header('Content-Type', 'image/png')
      const stream = fs.createReadStream(filePath)
      reply.send(stream)
    })
  })
}
