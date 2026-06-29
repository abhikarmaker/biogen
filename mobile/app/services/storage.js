import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AVATAR_KEY = 'biogen_avatar_uri';
const DISPLAY_NAME_KEY = 'biogen_display_name';

export const saveAvatarUri = (uri) => AsyncStorage.setItem(AVATAR_KEY, uri);
export const getAvatarUri = () => AsyncStorage.getItem(AVATAR_KEY);
export const removeAvatarUri = () => AsyncStorage.removeItem(AVATAR_KEY);

export const saveDisplayName = (name) => AsyncStorage.setItem(DISPLAY_NAME_KEY, name);
export const getDisplayName = () => AsyncStorage.getItem(DISPLAY_NAME_KEY);
export const removeDisplayName = () => AsyncStorage.removeItem(DISPLAY_NAME_KEY);

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
  await Promise.all([removeToken(), removeUser(), removeAvatarUri(), removeDisplayName()]);
};
