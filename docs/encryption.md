# CostPilot End-to-End Encryption (E2EE)

CostPilot uses an **App-Managed Encryption** model. This provides the security of End-to-End Encryption without the friction of requiring users to manually manage, memorize, or secure a 32-character master recovery key.

## Core Philosophy
The core philosophy revolves around the idea that the CostPilot application running on the user's device acts as the secure enclave. Data is fully readable locally but is transformed into opaque, cryptographically secure ciphertext before ever leaving the device. 

The cloud database (Supabase) acts entirely as a "dumb" storage locker. It knows *who* owns the locker, but it cannot see the contents inside.

## Key Derivation (App-Managed)
To make encryption completely invisible to the user across multiple devices (e.g., their iPhone and their Desktop Browser), CostPilot derives a deterministic Master Key for each user on-the-fly.

This is done using **PBKDF2 (Password-Based Key Derivation Function 2)** with the following inputs:
1. **The User's ID**: Provided by Google OAuth upon successful login.
2. **The App Salt**: A hidden environment variable (`VITE_ENCRYPTION_SALT`).

```typescript
const key = CryptoJS.PBKDF2(userId, salt, {
    keySize: 256 / 32, // 256-bit key
    iterations: 1000
});
```

Because PBKDF2 is deterministic, a user logging into their laptop will generate the exact same byte-for-byte AES encryption key as they generated on their phone.

### Why the Salt?
Even if a malicious actor gained full access to the Supabase database (which contains User IDs and the encrypted data), they cannot attempt to brute-force or "rainbow table" the encryption keys. Without the secret `VITE_ENCRYPTION_SALT` injected into the frontend production build, the User ID alone is useless for deriving the key.

## Sync Workflow

The synchronization engine (`CloudBackupService`) intercepts data immediately before it is sent to the cloud, and immediately after it is downloaded.

### Uploading (Push)
1. **Serialization**: A local `Transaction` or `Category` object is stripped of local-only metadata and converted to a flat Javascript Object.
2. **Stringification**: The object is converted to a JSON string.
3. **Encryption**: The JSON string is encrypted using AES-256 and the derived `User Key`.
4. **Transmission**: The resulting ciphertext is assigned to a `payload` property.
5. **Storage**: Supabase stores only the `id`, `user_id`, timestamps, and the encrypted `payload`. All contextual columns (`amount`, `title`, `date`) are dropped from the database schema entirely.

### Downloading (Pull)
1. **Retrieval**: The app fetches remote records, receiving the `payload` ciphertext.
2. **Decryption**: The app uses the derived `User Key` to decrypt the payload.
3. **Rehydration**: The decrypted JSON string is parsed back into a Javascript object.
4. **Resolution**: The app reattaches relational references (such as linking a transaction to its Category object) and merges the data into the Local Repository.

## Security Guarantees
- **Data at Rest**: Encrypted by default by Supabase, and doubly encrypted by CostPilot.
- **Data in Transit**: Encrypted via HTTPS, and doubly encrypted by CostPilot.
- **Service Provider Blindness**: If CostPilot's database provider (Supabase) is compromised, financial records remain unreadable.
- **Data Loss Prevention**: To lose access to their data, a user must lose complete access to their actual Google Account.
