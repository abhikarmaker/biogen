const mockPost = jest.fn();
const mockGet = jest.fn();

jest.mock('axios', () => ({
  create: jest.fn(() => ({ post: mockPost, get: mockGet })),
}));
jest.mock('../storage', () => ({
  saveToken: jest.fn(),
  saveUser: jest.fn(),
  clearAll: jest.fn(),
}));

const { login, register, logout } = require('../auth');
const { saveToken, saveUser, clearAll } = require('../storage');

afterEach(() => jest.clearAllMocks());

describe('login', () => {
  it('saves the token and user on success', async () => {
    mockPost.mockResolvedValue({ data: { token: 't1', user: { id: 'u1' } } });

    const user = await login('a@b.com', 'password1');

    expect(mockPost).toHaveBeenCalledWith('/api/auth/login', { email: 'a@b.com', password: 'password1' });
    expect(saveToken).toHaveBeenCalledWith('t1');
    expect(saveUser).toHaveBeenCalledWith({ id: 'u1' });
    expect(user).toEqual({ id: 'u1' });
  });

  it('re-throws server errors instead of falling back to a local session', async () => {
    const err = new Error('Invalid credentials');
    err.response = { status: 401 };
    mockPost.mockRejectedValue(err);

    await expect(login('a@b.com', 'wrong')).rejects.toThrow('Invalid credentials');
    expect(saveToken).not.toHaveBeenCalled();
  });

  it('falls back to a local session on a network error', async () => {
    mockPost.mockRejectedValue(new Error('Network Error'));

    const user = await login('a@b.com', 'password1');

    expect(saveToken).toHaveBeenCalledWith('local-session');
    expect(user.email).toBe('a@b.com');
  });
});

describe('register', () => {
  it('saves the token and user on success', async () => {
    mockPost.mockResolvedValue({ data: { token: 't1', user: { id: 'u1' } } });

    const user = await register('a@b.com', 'password1');

    expect(saveToken).toHaveBeenCalledWith('t1');
    expect(user).toEqual({ id: 'u1' });
  });
});

describe('logout', () => {
  it('clears stored auth state', async () => {
    await logout();
    expect(clearAll).toHaveBeenCalled();
  });
});
