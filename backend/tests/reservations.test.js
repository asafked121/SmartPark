const request = require('supertest');

jest.mock('../src/db', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

const pool = require('../src/db');
const app = require('../src/app');
const { driverToken, mockClient } = require('./helpers');

const token = driverToken();

beforeEach(() => jest.clearAllMocks());

describe('GET /api/reservations', () => {
  it('should return user reservations', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ reservation_id: 1, lot_name: 'North', slot_number: 'A-01', status: 'active' }],
    });

    const res = await request(app)
      .get('/api/reservations')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('should support pagination params', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/api/reservations?page=2&limit=5')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const callArgs = pool.query.mock.calls[0][1];
    expect(callArgs[1]).toBe(5);   // limit
    expect(callArgs[2]).toBe(5);   // offset = (2-1)*5
  });
});

describe('POST /api/reservations', () => {
  const futureStart = new Date(Date.now() + 3600000).toISOString();
  const futureEnd = new Date(Date.now() + 7200000).toISOString();

  it('should create a reservation with valid data', async () => {
    const client = mockClient();
    pool.connect.mockResolvedValueOnce(client);

    client.query
      .mockResolvedValueOnce({})                                          // BEGIN
      .mockResolvedValueOnce({ rows: [{ vehicle_id: 1 }] })              // vehicle check
      .mockResolvedValueOnce({ rows: [] })                                // overlap check
      .mockResolvedValueOnce({                                            // INSERT reservation
        rows: [{ reservation_id: 100, user_id: 1, lot_id: 1, slot_number: 'A-01', status: 'active' }],
      })
      .mockResolvedValueOnce({                                            // INSERT payment
        rows: [{ payment_id: 50, amount: '2.50', payment_status: 'pending' }],
      })
      .mockResolvedValueOnce({});                                         // COMMIT

    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vehicle_id: 1,
        lot_id: 1,
        slot_number: 'A-01',
        start_time: futureStart,
        end_time: futureEnd,
      });

    expect(res.status).toBe(201);
    expect(res.body.reservation.reservation_id).toBe(100);
    expect(res.body.payment.payment_status).toBe('pending');
    expect(client.release).toHaveBeenCalled();
  });

  it('should reject start time in the past', async () => {
    const pastStart = new Date(Date.now() - 3600000).toISOString();
    const pastEnd = new Date(Date.now() + 3600000).toISOString();

    const client = mockClient();
    pool.connect.mockResolvedValueOnce(client);

    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vehicle_id: 1,
        lot_id: 1,
        slot_number: 'A-01',
        start_time: pastStart,
        end_time: pastEnd,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/future/i);
  });

  it('should reject end time before start time', async () => {
    const client = mockClient();
    pool.connect.mockResolvedValueOnce(client);

    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vehicle_id: 1,
        lot_id: 1,
        slot_number: 'A-01',
        start_time: futureEnd,
        end_time: futureStart,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/after start/i);
  });

  it('should reject missing fields', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({ vehicle_id: 1 });

    expect(res.status).toBe(400);
  });

  it('should reject if vehicle does not belong to user', async () => {
    const client = mockClient();
    pool.connect.mockResolvedValueOnce(client);

    client.query
      .mockResolvedValueOnce({})                   // BEGIN
      .mockResolvedValueOnce({ rows: [] });        // vehicle check fails

    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vehicle_id: 999,
        lot_id: 1,
        slot_number: 'A-01',
        start_time: futureStart,
        end_time: futureEnd,
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/vehicle/i);
  });

  it('should reject overlapping reservation', async () => {
    const client = mockClient();
    pool.connect.mockResolvedValueOnce(client);

    client.query
      .mockResolvedValueOnce({})                                    // BEGIN
      .mockResolvedValueOnce({ rows: [{ vehicle_id: 1 }] })        // vehicle check
      .mockResolvedValueOnce({ rows: [{ reservation_id: 50 }] });  // overlap found

    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vehicle_id: 1,
        lot_id: 1,
        slot_number: 'A-01',
        start_time: futureStart,
        end_time: futureEnd,
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already reserved/i);
  });
});

describe('PATCH /api/reservations/:id/cancel', () => {
  it('should cancel an active reservation', async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{ reservation_id: 10, status: 'cancelled' }],
      })
      .mockResolvedValueOnce({});

    const res = await request(app)
      .patch('/api/reservations/10/cancel')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/cancelled/i);
  });

  it('should return 404 for non-existent reservation', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .patch('/api/reservations/999/cancel')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
