import { Platform } from 'react-native';

// Do NOT import react-native-purchases eagerly at module scope — it throws if
// the native module isn't linked (plain Expo Go). Every function below defers
// the require() and all native calls so this file is always safe to import,
// even with no RevenueCat keys configured yet.

const PRO_ENTITLEMENT = 'pro';

let configured = false;

function getApiKey() {
  return Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
}

function loadNativeModule() {
  try {
    return require('react-native-purchases').default;
  } catch {
    return null;
  }
}

export function isPurchasesConfigured() {
  return configured;
}

// Call once the real (non-local-session) user id is known — first call
// configures the SDK with that id directly, later calls just switch identity.
export async function initPurchases(userId) {
  const apiKey = getApiKey();
  if (!apiKey || !userId) return;

  const Purchases = loadNativeModule();
  if (!Purchases) return;

  try {
    if (!configured) {
      Purchases.configure({ apiKey, appUserID: userId });
      configured = true;
    } else {
      await Purchases.logIn(userId);
    }
  } catch (err) {
    console.warn('[purchases] init skipped:', err.message);
  }
}

export async function logoutPurchases() {
  if (!configured) return;
  const Purchases = loadNativeModule();
  if (!Purchases) return;
  try {
    await Purchases.logOut();
  } catch (err) {
    console.warn('[purchases] logout skipped:', err.message);
  }
}

export async function getOfferings() {
  if (!configured) return null;
  const Purchases = loadNativeModule();
  if (!Purchases) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (err) {
    console.warn('[purchases] getOfferings failed:', err.message);
    return null;
  }
}

export async function purchasePackage(pkg) {
  const Purchases = loadNativeModule();
  if (!configured || !Purchases) {
    throw new Error('Payments are not set up yet.');
  }
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restoreNativePurchases() {
  const Purchases = loadNativeModule();
  if (!configured || !Purchases) {
    throw new Error('Payments are not set up yet.');
  }
  return Purchases.restorePurchases();
}

export function isEntitledPro(customerInfo) {
  return !!customerInfo?.entitlements?.active?.[PRO_ENTITLEMENT];
}
