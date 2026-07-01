jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const SecureStore = require('expo-secure-store');
const { saveToken, getToken, removeToken } = require('../storage');

afterEach(() => jest.clearAllMocks());

describe('token storage', () => {
  it('saveToken stores the token under the expected key', async () => {
    await saveToken('abc123');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('biogen_token', 'abc123');
  });

  it('getToken reads the token from the expected key', async () => {
    SecureStore.getItemAsync.mockResolvedValue('abc123');
    const token = await getToken();
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('biogen_token');
    expect(token).toBe('abc123');
  });

  it('removeToken deletes the token', async () => {
    await removeToken();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('biogen_token');
  });
});
