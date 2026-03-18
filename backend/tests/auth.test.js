const request = require('supertest');
const bcrypt = require('bcrypt');

jest.mock('../src/db', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

const pool = require('../src/db');
const app = require('../src/app');
const { driverToken } = require('./helpers');

beforeEach(() => jest.clearAllMocks());

describe('POST /api/auth/register', () => {
  it('should register a new user with valid data', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ user_id: 1, email: 'new@test.com', role: 'driver', created_at: new Date() }],
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@test.com', password: 'securepass1' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('new@test.com');
    expect(res.body.user.role).toBe('driver');
    expect(res.body.token).toBeDefined();
  });

  it('should always assign driver role even if admin is requested', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ user_id: 2, email: 'sneaky@test.com', role: 'driver', created_at: new Date() }],
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'sneaky@test.com', password: 'securepass1', role: 'admin' });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('driver');
    const insertCall = pool.query.mock.calls[0];
    expect(insertCall[1][2]).toBe('driver');
  });

  it('should reject missing email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'securepass1' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('should reject password shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'short@test.com', password: 'abc1' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 characters/);
  });

  it('should reject password without a number', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'nonum@test.com', password: 'abcdefgh' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/number/i);
  });

  it('should reject duplicate email', async () => {
    pool.query.mockRejectedValueOnce({ code: '23505' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@test.com', password: 'securepass1' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered/i);
  });
});

describe('POST /api/auth/login', () => {
  const hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

  it('should login with valid credentials', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ user_id: 1, email: 'alice@test.com', password_hash: hash, role: 'driver', created_at: new Date() }],
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@test.com', password: 'password' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('alice@test.com');
    expect(res.body.token).toBeDefined();
  });

  it('should reject wrong password', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ user_id: 1, email: 'alice@test.com', password_hash: hash, role: 'driver' }],
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  it('should reject non-existent user', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password1' });

    expect(res.status).toBe(401);
  });

  it('should reject missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it('should return user profile with valid token', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ user_id: 1, email: 'driver@test.com', role: 'driver', created_at: new Date() }],
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${driverToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('driver@test.com');
  });

  it('should reject request without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('should reject invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.status).toBe(403);
  });
});
