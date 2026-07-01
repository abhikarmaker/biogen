const mockPurchases = {
  configure: jest.fn(),
  logIn: jest.fn(),
  logOut: jest.fn(),
  getOfferings: jest.fn(),
  purchasePackage: jest.fn(),
  restorePurchases: jest.fn(),
};

jest.mock('react-native-purchases', () => ({ default: mockPurchases }));

const ORIGINAL_ENV = process.env;

afterEach(() => {
  jest.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
});

describe('purchases.js — not configured (no keys set)', () => {
  beforeEach(() => {
    jest.resetModules();
    delete process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
    delete process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  });

  it('initPurchases is a no-op without an API key', async () => {
    const { initPurchases, isPurchasesConfigured } = require('../purchases');
    await initPurchases('user-1');
    expect(isPurchasesConfigured()).toBe(false);
    expect(mockPurchases.configure).not.toHaveBeenCalled();
  });

  it('getOfferings returns null when not configured', async () => {
    const { getOfferings } = require('../purchases');
    expect(await getOfferings()).toBeNull();
    expect(mockPurchases.getOfferings).not.toHaveBeenCalled();
  });

  it('purchasePackage throws a "not configured" error', async () => {
    const { purchasePackage } = require('../purchases');
    await expect(purchasePackage({})).rejects.toThrow('not set up yet');
  });
});

describe('purchases.js — configured', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY = 'ios-key';
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY = 'android-key';
  });

  it('configures on first initPurchases call, logs in on subsequent calls', async () => {
    const { initPurchases, isPurchasesConfigured } = require('../purchases');

    await initPurchases('user-1');
    expect(mockPurchases.configure).toHaveBeenCalledWith(
      expect.objectContaining({ appUserID: 'user-1' })
    );
    expect(isPurchasesConfigured()).toBe(true);

    await initPurchases('user-2');
    expect(mockPurchases.logIn).toHaveBeenCalledWith('user-2');
    expect(mockPurchases.configure).toHaveBeenCalledTimes(1);
  });

  it('getOfferings returns the current offering', async () => {
    const { initPurchases, getOfferings } = require('../purchases');
    await initPurchases('user-1');
    mockPurchases.getOfferings.mockResolvedValue({ current: { availablePackages: [] } });

    const offering = await getOfferings();
    expect(offering).toEqual({ availablePackages: [] });
  });

  it('purchasePackage returns customerInfo on success', async () => {
    const { initPurchases, purchasePackage } = require('../purchases');
    await initPurchases('user-1');
    mockPurchases.purchasePackage.mockResolvedValue({ customerInfo: { entitlements: {} } });

    const customerInfo = await purchasePackage({ identifier: 'monthly' });
    expect(customerInfo).toEqual({ entitlements: {} });
  });

  it('isEntitledPro reflects the active pro entitlement', () => {
    const { isEntitledPro } = require('../purchases');
    expect(isEntitledPro({ entitlements: { active: { pro: {} } } })).toBe(true);
    expect(isEntitledPro({ entitlements: { active: {} } })).toBe(false);
    expect(isEntitledPro(null)).toBe(false);
  });

  it('logoutPurchases calls Purchases.logOut once configured', async () => {
    const { initPurchases, logoutPurchases } = require('../purchases');
    await initPurchases('user-1');
    await logoutPurchases();
    expect(mockPurchases.logOut).toHaveBeenCalled();
  });
});
