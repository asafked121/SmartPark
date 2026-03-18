const request = require('supertest');

jest.mock('../src/db', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

const pool = require('../src/db');
const app = require('../src/app');
const { driverToken, adminToken } = require('./helpers');

beforeEach(() => jest.clearAllMocks());

describe('Admin routes authorization', () => {
  it('should reject non-admin users', async () => {
    const res = await request(app)
      .get('/api/admin/occupancy')
      .set('Authorization', `Bearer ${driverToken()}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/admin/i);
  });

  it('should reject unauthenticated requests', async () => {
    const res = await request(app).get('/api/admin/occupancy');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/admin/occupancy', () => {
  it('should return lot occupancy data', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { lot_id: 1, name: 'North Campus Lot', total_capacity: 30, currently_occupied: '5', currently_available: '25' },
      ],
    });

    const res = await request(app)
      .get('/api/admin/occupancy')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('North Campus Lot');
  });
});

describe('GET /api/admin/revenue', () => {
  it('should return revenue data per lot', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { lot_name: 'North Campus Lot', total_transactions: '10', total_revenue: '25.00', pending_revenue: '15.00' },
      ],
    });

    const res = await request(app)
      .get('/api/admin/revenue')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body[0].total_revenue).toBe('25.00');
  });
});

describe('GET /api/admin/reservations', () => {
  it('should return all reservations', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { reservation_id: 1, email: 'alice@test.com', status: 'active', lot_name: 'North Campus Lot' },
        { reservation_id: 2, email: 'bob@test.com', status: 'completed', lot_name: 'South Campus Lot' },
      ],
    });

    const res = await request(app)
      .get('/api/admin/reservations')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('should support status and lot_id filters', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ reservation_id: 1, status: 'active', lot_name: 'North Campus Lot' }],
    });

    const res = await request(app)
      .get('/api/admin/reservations?status=active&lot_id=1')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    const queryStr = pool.query.mock.calls[0][0];
    expect(queryStr).toContain('r.status = $');
    expect(queryStr).toContain('r.lot_id = $');
  });

  it('should support pagination', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await request(app)
      .get('/api/admin/reservations?page=3&limit=10')
      .set('Authorization', `Bearer ${adminToken()}`);

    const params = pool.query.mock.calls[0][1];
    expect(params).toContain(10);  // limit
    expect(params).toContain(20);  // offset = (3-1)*10
  });
});
