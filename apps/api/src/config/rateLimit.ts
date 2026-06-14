// Per-endpoint rate limit configuration (requests per minute)
export const rateLimitConfig: Record<string, number> = {
  '/auth/login': 10,
  '/auth/register': 5,
  '/api/v1/wallet/create': 20,
  '/api/v1/payment/send': 30,
  '/api/v1/streaming/create': 20,
  default: 100,
};

export function getLimit(url: string): number {
  const path = url.split('?')[0];
  return rateLimitConfig[path] ?? rateLimitConfig.default;
}
