import { FastifyInstance, FastifyReply } from 'fastify'

export async function statusRoutes(app: FastifyInstance) {
  app.get('/health', async (_, res: FastifyReply) => {
    res.send({
      status: 'OK',
    })
  })
}
