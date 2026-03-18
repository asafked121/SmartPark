const jwt = require('jsonwebtoken');

function driverToken(overrides = {}) {
  return jwt.sign(
    { user_id: 1, email: 'driver@test.com', role: 'driver', ...overrides },
    'test-secret',
    { expiresIn: '1h' }
  );
}

function adminToken(overrides = {}) {
  return jwt.sign(
    { user_id: 99, email: 'admin@test.com', role: 'admin', ...overrides },
    'test-secret',
    { expiresIn: '1h' }
  );
}

function mockClient() {
  return {
    query: jest.fn(),
    release: jest.fn(),
  };
}

module.exports = { driverToken, adminToken, mockClient };
