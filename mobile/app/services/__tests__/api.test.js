jest.mock('../storage', () => ({ getToken: jest.fn() }));

const { getToken } = require('../storage');
const api = require('../api').default;

afterEach(() => jest.clearAllMocks());

function withCapturingAdapter() {
  let captured;
  api.defaults.adapter = (config) => {
    captured = config;
    return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config });
  };
  return () => captured;
}

describe('api client auth header', () => {
  it('attaches an Authorization header when a token exists', async () => {
    getToken.mockResolvedValue('secret-token');
    const getCaptured = withCapturingAdapter();

    await api.get('/api/user/profile');

    expect(getCaptured().headers.Authorization).toBe('Bearer secret-token');
  });

  it('omits the Authorization header when no token exists', async () => {
    getToken.mockResolvedValue(null);
    const getCaptured = withCapturingAdapter();

    await api.get('/api/user/profile');

    expect(getCaptured().headers.Authorization).toBeUndefined();
  });
});
