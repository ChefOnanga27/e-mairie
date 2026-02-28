import request from 'supertest';
import app from '../src/server.js';

// bypass authentication middleware for tests
jest.mock('../../../shared/middleware/auth.js', () => ({
  authenticate: (req, res, next) => next(),
  authorize: () => (req, res, next) => next(),
}));

// mock Prisma client to avoid hitting a real database
jest.mock('../../../shared/config/prisma.js', () => ({
  agent: {
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
  },
}));

describe('Agent Service API', () => {
  it('should respond to health check', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('service', 'agent-service');
  });

  it('GET /api/agent returns empty paginated list', async () => {
    const res = await request(app).get('/api/agent');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 10, total: 0 });
  });
});
