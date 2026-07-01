jest.mock('../services/supabaseService', () => {
  const { createSupabaseMock } = require('./utils/supabaseMock');
  return createSupabaseMock();
});

const jwt = require('jsonwebtoken');
const supabase = require('../services/supabaseService');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

afterEach(() => supabase.__reset());

function mockRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe('authMiddleware', () => {
  it('rejects a missing authorization header', async () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects an invalid token', async () => {
    const req = { headers: { authorization: 'Bearer not-a-real-token' } };
    const res = mockRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches req.user and calls next for a valid token', async () => {
    const token = jwt.sign({ userId: 'u1' }, process.env.JWT_SECRET);
    supabase.__push({ data: { id: 'u1', email: 'a@b.com' }, error: null });

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ id: 'u1', email: 'a@b.com' });
  });
});

describe('adminMiddleware', () => {
  it('rejects a non-admin role', async () => {
    const token = jwt.sign({ role: 'user' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    await adminMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows an admin role through', async () => {
    const token = jwt.sign({ role: 'admin', email: 'admin@biogen.app' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    await adminMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.admin.role).toBe('admin');
  });
});
