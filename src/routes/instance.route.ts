import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { checkApiIsReady } from '../middlewares/check-api-is-ready'
import { getWhatsappClient } from '../services/whatsappClientService'

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
          dominio: z.string(),
        })

        const { message, number, dominio } = schema.parse(req.body)

        const client = await getWhatsappClient(app, dominio)

        if (!client) {
          throw new Error('Erro ao puxar cliente')
        }

        const sendedMessage = await client.client.sendMessage(
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
          dominio: z.string(),
        })

        console.log(request.body)

        const { message, nomeGrupo, dominio } = schema.parse(request.body)

        if (nomeGrupo.length < 1) {
          reply.send({
            type: 'error',
            message: 'Nenhum grupo encontrado , verifique os nomes',
            errorNumber: '302',
          })
        }

        const client = await getWhatsappClient(app, dominio)

        if (!client) {
          throw new Error('Erro ao puxar cliente')
        }

        const groups = await client.client.getGroups()

        for (const name of nomeGrupo) {
          const group = groups.find((grp) => grp.name === name)
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

  app.get('/qr/:domain', { websocket: true }, async (connection, req) => {
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
      return
    }

    const client = await getWhatsappClient(app, domain)

    if (client) {
      if (client.qr) {
        connection.socket.send(client.qr)
      }

      client.client.on('qr', (qr) => {
        connection.socket.send(qr)
      })
      client.client.on('ready', () => {
        connection.socket.send('ready')
      })
    }
  })

  app.get(
    '/connected/:domain',
    {
      preHandler: [checkApiIsReady],
    },
    async (_: FastifyRequest, res: FastifyReply) => {
      res.send({
        status: 'ok',
      })
    },
  )

  // app.get('/screen', async (request: FastifyRequest, reply: FastifyReply) => {
  //   const { filename } = request.query

  //   if (!filename) {
  //     return reply.code(400).send('Nome do arquivo não fornecido')
  //   }

  //   return reply.sendFile(`${filename}.png`)
  // })

  app.get(
    '/disconnect/:domain',
    {
      preHandler: [checkApiIsReady],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { domain } = request.params as any
      const client = app.whatsappClients[domain]
      if (client) {
        await client.client.destroy()
        delete app.whatsappClients[domain]
        reply.send({ message: 'Desconectado com sucesso' })
      } else {
        reply.status(404).send({ message: 'Cliente não encontrado' })
      }
    },
  )
}
