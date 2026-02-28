import CryptoJS from 'crypto-js';

// The salt ensures that even if two users have the same ID (impossible with Google, but good practice),
// or if the database is leaked, the encryption keys cannot be rainbow-tabled without the app secret.
export const getEncryptionSalt = (): string => {
    return import.meta.env.VITE_ENCRYPTION_SALT || 'default-local-dev-salt-replace-in-production';
};

/**
 * Derives a deterministic AES encryption key using the user's ID and the application salt.
 * 
 * @param userId - The Google User ID (e.g., from Supabase Auth)
 * @returns A base64 string representation of the derived key
 */
export const deriveUserKey = (userId: string): string => {
    if (!userId) throw new Error("Cannot derive key: User ID is missing");

    const salt = getEncryptionSalt();

    // Using PBKDF2 to derive a strong 256-bit key
    // In a real-world scenario with high security needs, you might increase iterations, 
    // but for client-side synchronous JS, 1000 is a decent balance of security and performance.
    const key = CryptoJS.PBKDF2(userId, salt, {
        keySize: 256 / 32,
        iterations: 1000
    });

    return key.toString(CryptoJS.enc.Base64);
};

/**
 * Encrypts a Javascript object into a secure AES ciphertext string.
 * @param payload - The data object to encrypt
 * @param keyBase64 - The derived user key in base64
 * @returns The encrypted string
 */
export const encryptPayload = (payload: any, keyBase64: string): string => {
    try {
        const jsonString = JSON.stringify(payload);
        const encrypted = CryptoJS.AES.encrypt(jsonString, keyBase64).toString();
        return encrypted;
    } catch (error) {
        console.error("Encryption failed:", error);
        throw new Error("Failed to encrypt data payload");
    }
};

/**
 * Decrypts an AES ciphertext string back into a Javascript object.
 * @param cipherText - The encrypted string from Supabase
 * @param keyBase64 - The derived user key in base64
 * @returns The decrypted data object, or null if decryption fails
 */
export const decryptPayload = (cipherText: string, keyBase64: string): any | null => {
    if (!cipherText) return null;

    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, keyBase64);
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

        if (!decryptedString) {
            throw new Error("Decryption resulted in empty string - possible wrong key");
        }

        return JSON.parse(decryptedString);
    } catch (error) {
        console.error("Decryption failed:", error);
        return null;
    }
};
