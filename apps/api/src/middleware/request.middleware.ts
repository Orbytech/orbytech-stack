import { FastifyReply, FastifyRequest } from 'fastify';

export const requestLogger = async (request: FastifyRequest, reply: FastifyReply) => {
  const start = Date.now();
  
  // Add request ID
  request.id = generateRequestId();
  
  // Log incoming request
  request.log.info({
    method: request.method,
    url: request.url,
    userAgent: request.headers['user-agent'],
    ip: request.ip,
    requestId: request.id,
  }, 'Incoming request');

  // Hook to log response
  reply.addHook('onSend', async (request, reply) => {
    const duration = Date.now() - start;
    
    request.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration: `${duration}ms`,
      requestId: request.id,
    }, 'Request completed');
  });
};

export const rateLimiter = async (request: FastifyRequest, reply: FastifyReply) => {
  // Simple rate limiting by IP (in production, use Redis or similar)
  const ip = request.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;

  // This is a simple in-memory rate limiter
  // In production, use a proper rate limiting solution
  const key = `rate_limit:${ip}`;
  const requests = (global as any)[key] || [];
  
  // Remove old requests outside the window
  const validRequests = requests.filter((timestamp: number) => now - timestamp < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return reply.status(429).send({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
      timestamp: new Date(),
    });
  }
  
  // Add current request timestamp
  validRequests.push(now);
  (global as any)[key] = validRequests;
};

export const corsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  // CORS is handled by @fastify/cors plugin, but this can be used for additional logic
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

export const securityHeaders = async (request: FastifyRequest, reply: FastifyReply) => {
  // Add security headers
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'DENY');
  reply.header('X-XSS-Protection', '1; mode=block');
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (process.env.NODE_ENV === 'production') {
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
};

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
