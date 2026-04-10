/**
 * encryption.ts
 *
 * Thin, safe wrappers around expo-secure-store for persisting sensitive data.
 * All keys are namespaced under 'silk:' to avoid collisions with other storage.
 */
import * as SecureStore from 'expo-secure-store';

const NAMESPACE = 'silk:';

function namespacedKey(key: string): string {
  return `${NAMESPACE}${key}`;
}

// Store a string value securely
export async function storeSecurely(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(namespacedKey(key), value);
  } catch (error) {
    console.error(`[encryption] Failed to store key "${key}":`, error);
    throw error;
  }
}

// Retrieve a stored value, returns null if not found
export async function retrieveSecurely(key: string): Promise<string | null> {
  try {
    const result = await SecureStore.getItemAsync(namespacedKey(key));
    return result ?? null;
  } catch (error) {
    console.error(`[encryption] Failed to retrieve key "${key}":`, error);
    return null;
  }
}

// Delete a stored value
export async function deleteSecurely(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(namespacedKey(key));
  } catch (error) {
    console.error(`[encryption] Failed to delete key "${key}":`, error);
    throw error;
  }
}

// Store a PIN hash for a user
// Key: `silk:pin:${userId}`
export async function storePinHash(userId: string, pinHash: string): Promise<void> {
  await storeSecurely(`pin:${userId}`, pinHash);
}

// Verify a PIN hash against stored value
// Returns true if matches, false if no stored hash or mismatch
export async function verifyPin(userId: string, pinHash: string): Promise<boolean> {
  try {
    const stored = await retrieveSecurely(`pin:${userId}`);
    if (stored === null) {
      return false;
    }
    return stored === pinHash;
  } catch (error) {
    console.error(`[encryption] Failed to verify PIN for user "${userId}":`, error);
    return false;
  }
}

// Store device ID
export async function storeDeviceId(deviceId: string): Promise<void> {
  await storeSecurely('device:id', deviceId);
}

// Retrieve device ID
export async function getDeviceId(): Promise<string | null> {
  return retrieveSecurely('device:id');
}
