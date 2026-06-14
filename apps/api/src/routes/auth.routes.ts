import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// In-memory user store (replace with DB in production)
const users = new Map<string, { id: string; email: string; name: string; passwordHash: string }>();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password, name } = registerSchema.parse(request.body);

    if (users.has(email)) {
      return reply.code(409).send({
        success: false,
        error: { code: 'CONFLICT', message: 'Email already registered' },
        timestamp: new Date().toISOString(),
      });
    }

    const user = { id: crypto.randomUUID(), email, name, passwordHash: hashPassword(password) };
    users.set(email, user);

    const token = fastify.jwt.sign({ sub: user.id, email: user.email });

    return reply.code(201).send({
      success: true,
      data: { id: user.id, email: user.email, name: user.name, token },
      timestamp: new Date().toISOString(),
    });
  });

  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = loginSchema.parse(request.body);
    const user = users.get(email);

    if (!user || user.passwordHash !== hashPassword(password)) {
      return reply.code(401).send({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        timestamp: new Date().toISOString(),
      });
    }

    const token = fastify.jwt.sign({ sub: user.id, email: user.email });

    return reply.send({
      success: true,
      data: { id: user.id, email: user.email, name: user.name, token },
      timestamp: new Date().toISOString(),
    });
  });
}
