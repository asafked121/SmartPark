const errorHandler = require('../src/middleware/errorHandler');

describe('errorHandler middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('should return 500 with generic message for unhandled errors', () => {
    const err = new Error('Something broke');
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });

  it('should use the error status if provided', () => {
    const err = new Error('Not allowed');
    err.status = 403;
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not allowed' });
  });
});

describe('handleValidation middleware', () => {
  it('should pass validation through to the route (tested via supertest in other suites)', async () => {
    const request = require('supertest');

    jest.mock('../src/db', () => ({
      query: jest.fn(),
      connect: jest.fn(),
    }));

    const app = require('../src/app');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'valid@test.com', password: 'pass123' });

    // With valid fields, validation passes and the route handler runs (returns 401 because no db user)
    expect(res.status).not.toBe(400);
  });

  it('should return 400 for invalid input', async () => {
    const request = require('supertest');
    const app = require('../src/app');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
