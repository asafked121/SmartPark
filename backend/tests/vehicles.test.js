const request = require('supertest');

jest.mock('../src/db', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

const pool = require('../src/db');
const app = require('../src/app');
const { driverToken } = require('./helpers');

const token = driverToken();

beforeEach(() => jest.clearAllMocks());

describe('GET /api/vehicles', () => {
  it('should return user vehicles', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { vehicle_id: 1, user_id: 1, license_plate: 'ABC-1234', make: 'Toyota', model: 'Camry' },
      ],
    });

    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].license_plate).toBe('ABC-1234');
  });

  it('should require authentication', async () => {
    const res = await request(app).get('/api/vehicles');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/vehicles', () => {
  it('should add a vehicle with valid data', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ vehicle_id: 10, user_id: 1, license_plate: 'NEW-0001', make: 'Honda', model: 'Civic' }],
    });

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({ license_plate: 'new-0001', make: 'Honda', model: 'Civic' });

    expect(res.status).toBe(201);
    expect(res.body.license_plate).toBe('NEW-0001');
  });

  it('should reject missing fields', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({ license_plate: 'ABC-1234' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it('should reject duplicate license plate', async () => {
    pool.query.mockRejectedValueOnce({ code: '23505' });

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({ license_plate: 'DUP-0001', make: 'Ford', model: 'F-150' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered/i);
  });
});

describe('DELETE /api/vehicles/:vehicleId', () => {
  it('should delete own vehicle', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ vehicle_id: 1, license_plate: 'ABC-1234' }],
    });

    const res = await request(app)
      .delete('/api/vehicles/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/removed/i);
  });

  it('should return 404 for non-existent vehicle', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .delete('/api/vehicles/999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
