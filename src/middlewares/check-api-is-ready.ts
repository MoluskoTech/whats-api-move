import { FastifyReply, FastifyRequest } from 'fastify'

interface RequestParams {
  domain?: string
}

interface RequestBody {
  dominio?: string
}

export async function checkApiIsReady(
  request: FastifyRequest<{ Params: RequestParams; Body: RequestBody }>,
  reply: FastifyReply,
) {
  const domain = request.params.domain || request.body.dominio

  if (!domain) {
    reply.status(400).send({
      type: 'error',
      message: 'Dominio não fornecido',
      errorNumber: 100,
    })
    return
  }

  const whatsappClientManager = request.server.whatsappClients[domain]

  if (!whatsappClientManager) {
    reply.status(400).send({
      type: 'error',
      message: 'Cliente não encontrado',
      errorNumber: 103,
    })
  }

  if (whatsappClientManager.qr) {
    reply.status(400).send({
      type: 'error',
      message: 'Necessário validar o qrCode',
      errorNumber: 101,
      qr: whatsappClientManager.qr,
    })
    return
  }
  if (whatsappClientManager.client.status !== 'ready') {
    reply.status(400).send({
      type: 'error',
      message: 'Api em inicialização , favor aguardar',
      errorNumber: 102,
    })
  }
}
