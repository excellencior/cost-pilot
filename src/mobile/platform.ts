import { Capacitor } from '@capacitor/core';

/**
 * Check if the app is running on a native platform (Android/iOS).
 */
export const isNative = (): boolean => Capacitor.isNativePlatform();

/**
 * Get the current platform name.
 */
export const getPlatform = (): string => Capacitor.getPlatform();
