import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from './config';
import { walletRoutes } from './routes/wallet.routes';
import { paymentRoutes } from './routes/payment.routes';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger, rateLimiter, securityHeaders } from './middleware/request.middleware';

const server = Fastify({
  logger: {
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
  },
});

// Register error handler
server.setErrorHandler(errorHandler);

// Register plugins
server.register(cors, {
  origin: config.cors.origin,
  credentials: config.cors.credentials,
});

server.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
});

server.register(jwt, {
  secret: config.jwt.secret,
  sign: {
    expiresIn: config.jwt.expiresIn,
  },
});

// Register Swagger documentation
server.register(swagger, {
  swagger: {
    info: {
      title: 'OrbyTech API',
      description: 'Stellar payment and wallet management API',
      version: '1.0.0',
      contact: {
        name: 'OrbyTech Team',
        email: 'support@orbytech.com',
      },
    },
    host: `localhost:${config.port}`,
    schemes: ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    securityDefinitions: {
      Bearer: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header',
      },
    },
    security: [{ Bearer: [] }],
  },
});

server.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false,
  },
});

// Register middleware
server.addHook('preHandler', requestLogger);
server.addHook('preHandler', rateLimiter);
server.addHook('preHandler', securityHeaders);

// Health check route
server.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    network: config.stellar.network,
  };
});

// API info route
server.get('/api/v1/info', async (request, reply) => {
  return {
    message: 'OrbyTech API',
    version: '1.0.0',
    network: config.stellar.network,
    endpoints: {
      wallet: '/api/v1/wallet',
      payment: '/api/v1/payment',
      docs: '/docs',
    },
    timestamp: new Date().toISOString(),
  };
});

// Register API routes
server.register(async function (fastify) {
  fastify.register(walletRoutes, { prefix: '/api/v1' });
  fastify.register(paymentRoutes, { prefix: '/api/v1' });
});

// 404 handler
server.setNotFoundHandler(async (request, reply) => {
  return reply.status(404).send({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
    timestamp: new Date(),
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await server.close();
  process.exit(0);
});

const start = async () => {
  try {
    await server.listen({ 
      port: config.port, 
      host: config.host 
    });
    
    console.log(`\n`);
    console.log(`\x1b[36m%s\x1b[0m`, 'OrbyTech API Server Started');
    console.log(`\x1b[32m%s\x1b[0m`, `  Port: ${config.port}`);
    console.log(`\x1b[32m%s\x1b[0m`, `  Network: ${config.stellar.network}`);
    console.log(`\x1b[32m%s\x1b[0m`, `  Environment: ${config.nodeEnv}`);
    console.log(`\x1b[32m%s\x1b[0m`, `  Docs: http://localhost:${config.port}/docs`);
    console.log(`\x1b[32m%s\x1b[0m`, `  Health: http://localhost:${config.port}/health`);
    console.log(`\n`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
