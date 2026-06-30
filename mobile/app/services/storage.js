import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const avatarKey = (uid) => `biogen_avatar_${uid}`;
const nameKey = (uid) => `biogen_name_${uid}`;

export const saveAvatarUri = (uid, uri) => AsyncStorage.setItem(avatarKey(uid), uri);
export const getAvatarUri = (uid) => AsyncStorage.getItem(avatarKey(uid));
export const removeAvatarUri = (uid) => AsyncStorage.removeItem(avatarKey(uid));

export const saveDisplayName = (uid, name) => AsyncStorage.setItem(nameKey(uid), name);
export const getDisplayName = (uid) => AsyncStorage.getItem(nameKey(uid));
export const removeDisplayName = (uid) => AsyncStorage.removeItem(nameKey(uid));

const TOKEN_KEY = 'biogen_token';
const USER_KEY = 'biogen_user';

export const saveToken = async (token) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async () => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const removeToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

export const saveUser = async (user) => {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
};

export const getUser = async () => {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const removeUser = async () => {
  await SecureStore.deleteItemAsync(USER_KEY);
};

export const clearAll = async () => {
  await Promise.all([removeToken(), removeUser()]);
};
