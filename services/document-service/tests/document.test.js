import request from 'supertest';
import app from '../src/server.js';

// skip middlewares during tests
jest.mock('../../../shared/middleware/auth.js', () => ({
  authenticate: (req, res, next) => next(),
  authorize: () => (req, res, next) => next(),
}));

// mock prisma client to avoid hitting database
jest.mock('../../../shared/config/prisma.js', () => ({
  document: {
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    findUnique: jest.fn().mockResolvedValue(null),
  },
  typeDocument: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
  },
}));

describe('Document Service API', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('service', 'document-service');
  });

  it('GET /api/documents returns paginated empty list', async () => {
    const res = await request(app).get('/api/documents');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 10, total: 0 });
  });
});
