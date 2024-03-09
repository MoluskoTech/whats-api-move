import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

export async function localizacaoRoutes(app: FastifyInstance) {
  app.post('/localizacao', async (req: FastifyRequest, res: FastifyReply) => {
    console.log({ body: req.body })

    res.send().status(200)
  })
}
