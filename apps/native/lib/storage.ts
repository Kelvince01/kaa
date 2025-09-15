import { MMKV } from "react-native-mmkv";
import type { StateStorage } from "zustand/middleware";

// Create an MMKV instance
export const storage = new MMKV({
  id: "your-storage-id",
  encryptionKey: "your-encryption-key", // Encryption ensures secure storage
});

// Configure Zustand to use MMKV for state persistence
export const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    storage.set(name, value);
  },
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    storage.delete(name);
  },
};

export default zustandStorage;
