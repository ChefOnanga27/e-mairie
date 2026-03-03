import request from 'supertest';
import app from '../src/server.js';

describe('Auth Service', () => {
  describe('POST /api/auth/login', () => {
    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ login: 'notexist@test.com', motDePasse: 'wrong' });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 if fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /health', () => {
    it('should return service health', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('auth-service');
    });
  });
});