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

describe('GET /api/payments', () => {
  it('should return user payments', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { payment_id: 1, amount: '5.00', payment_status: 'paid', lot_name: 'North Campus Lot' },
      ],
    });

    const res = await request(app)
      .get('/api/payments')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].amount).toBe('5.00');
  });
});

describe('PATCH /api/payments/:id/pay', () => {
  it('should process a pending payment', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ payment_id: 5, payment_status: 'paid', amount: '5.00' }],
    });

    const res = await request(app)
      .patch('/api/payments/5/pay')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/processed/i);
    expect(res.body.payment.payment_status).toBe('paid');
  });

  it('should return 404 if payment not found or not pending', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .patch('/api/payments/999/pay')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
