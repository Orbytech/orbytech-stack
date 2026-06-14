import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { StellarService } from '../services/stellar.service';

const startTime = Date.now();

export async function statsRoutes(fastify: FastifyInstance) {
  const stellarService = new StellarService();

  fastify.get('/stats', {
    schema: {
      description: 'Get network and platform statistics',
      tags: ['stats'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const networkInfo = stellarService.getNetworkInfo();

    return reply.send({
      success: true,
      data: {
        network: networkInfo.network,
        horizonUrl: networkInfo.horizonUrl,
        uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  });
}
