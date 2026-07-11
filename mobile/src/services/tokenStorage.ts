import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// expo-secure-store has no web implementation; AsyncStorage falls back to
// localStorage on web, so we route by platform behind a shared interface.
export async function getItemAsync(key: string): Promise<string | null> {
  return Platform.OS === 'web' ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key);
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  return Platform.OS === 'web' ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  return Platform.OS === 'web' ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key);
}
