const request = require('supertest');
const app = require('../src/app');

describe('API', () => {
  test('GET / returns message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBeDefined();
  });

  test('GET /health returns UP', async () => {
    const res = await request(app).get('/health');
    expect(res.body.status).toBe('UP');
  });

  test('GET /calc/add works', async () => {
    const res = await request(app).get('/calc/add?a=5&b=3');
    expect(res.body.result).toBe(8);
  });

  test('invalid numbers return 400', async () => {
    const res = await request(app).get('/calc/add?a=x&b=3');
    expect(res.statusCode).toBe(400);
  });

  test('unknown operation returns 404', async () => {
    const res = await request(app).get('/calc/power?a=2&b=3');
    expect(res.statusCode).toBe(404);
  });

  test('divide by zero returns 400', async () => {
    const res = await request(app).get('/calc/divide?a=2&b=0');
    expect(res.statusCode).toBe(400);
  });
});
