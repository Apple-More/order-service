// tests/health.test.ts
import request from 'supertest';
import app from '../src/app';

describe('Health Check', () => {
  it('should return 200 and status UP on GET /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'UP' });
  });
});

describe('404 Not Found Handler', () => {
  it('should return 404 and an error message for unknown routes', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/); // Check Content-Type
    expect(res.body).toMatchObject({ error: 'Not Found' });
  });
});