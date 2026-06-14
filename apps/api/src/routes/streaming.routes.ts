import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

const createStreamSchema = z.object({
  sender: z.string().regex(/^G[A-Z0-9]{55}$/),
  recipient: z.string().regex(/^G[A-Z0-9]{55}$/),
  totalAmount: z.string().regex(/^\d+(\.\d+)?$/),
  duration: z.number().int().positive(), // seconds
  asset: z.string().default('XLM'),
});

const cancelStreamSchema = z.object({ streamId: z.string().uuid() });

// In-memory store (replace with DB in production)
const streams = new Map<string, any>();

export async function streamingRoutes(fastify: FastifyInstance) {
  fastify.post('/streaming/create', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createStreamSchema.parse(request.body);
    const streamId = crypto.randomUUID();
    const stream = {
      id: streamId,
      ...body,
      status: 'active',
      startedAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + body.duration * 1000).toISOString(),
      withdrawn: '0',
    };
    streams.set(streamId, stream);
    return reply.code(201).send({ success: true, data: stream, timestamp: new Date().toISOString() });
  });

  fastify.delete('/streaming/:streamId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { streamId } = cancelStreamSchema.parse(request.params);
    const stream = streams.get(streamId);
    if (!stream) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Stream not found' } });
    stream.status = 'cancelled';
    stream.cancelledAt = new Date().toISOString();
    return reply.send({ success: true, data: stream, timestamp: new Date().toISOString() });
  });

  fastify.get('/streaming/:streamId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { streamId } = cancelStreamSchema.parse(request.params);
    const stream = streams.get(streamId);
    if (!stream) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Stream not found' } });
    return reply.send({ success: true, data: stream, timestamp: new Date().toISOString() });
  });

  fastify.get('/streaming', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ success: true, data: Array.from(streams.values()), timestamp: new Date().toISOString() });
  });
}
