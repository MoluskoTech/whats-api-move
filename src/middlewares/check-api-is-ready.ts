import { FastifyReply, FastifyRequest } from 'fastify'

export async function checkApiIsReady(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const whatsappClientManager = request.server.whatsappClient

  if (whatsappClientManager.qr) {
    reply.send({
      type: 'error',
      message: 'Necessário validar o qrCode',
      errorNumber: 101,
      qr: whatsappClientManager.qr,
    })
    return
  }
  if (whatsappClientManager.client.status !== 'ready') {
    reply.send({
      type: 'error',
      message: 'Api em inicialização , favor aguardar',
      errorNumber: 102,
    })
  }
}
