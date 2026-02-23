# Account Deletion & Recovery Process

This document outlines the architecture, security measures, and implementation details of the CostPilot account deletion system.

## Overview

CostPilot provides a **30-day grace period** for account deletion. This prevents accidental data loss and allows users to recover their financial history simply by logging back into their account.

### The Flow
1. **Initiation**: User triggers deletion in Settings.
2. **Verification**: User must type `DELETE ACCOUNT {email}` to confirm intent.
3. **Scheduling**: The app sets `deletion_scheduled_at` to the current timestamp in the Supabase `profiles` table.
4. **Grace Period**: The account remains in the database for 30 days.
5. **Recovery**: Logging in within the 30-day window automatically cancels the deletion.
6. **Hard Deletion**: After 30 days, the record is permanently removed via a server-side cleanup process.

---

## Security & Architectural Design

### 1. Frontend Verification
To prevent accidental clicks, the UI requires an explicit string match. This ensures the user is conscious of the action and its consequences.

### 2. Backend Enforcement (Supabase)
While the frontend handles the UI, security and "truth" are enforced at the database level to prevent attackers from spoofing deletion dates or bypassing the grace period.

#### A. Preventing Date Spoofing (SQL Trigger)
To prevent a malicious client from setting a `deletion_scheduled_at` date in the past (to bypass the 30-day window), a Postgres trigger should be used to force the server's time.

```sql
-- SQL to enforce server-side timestamping
CREATE OR REPLACE FUNCTION protect_deletion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- If the date is being set, force it to be NOW()
    IF NEW.deletion_scheduled_at IS NOT NULL AND (OLD.deletion_scheduled_at IS NULL) THEN
        NEW.deletion_scheduled_at = timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_deletion_time
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    WHEN (NEW.deletion_scheduled_at IS DISTINCT FROM OLD.deletion_scheduled_at)
    EXECUTE FUNCTION protect_deletion_timestamp();
```

#### B. Automated Cleanup (`pg_cron`)
Since the frontend cannot delete data while closed, we use a scheduled task to perform the "Hard Delete."

```sql
-- SQL to automatically delete accounts older than 30 days
-- Requires 'pg_cron' extension enabled in Supabase
SELECT cron.schedule('delete-expired-accounts', '0 0 * * *', $$
    DELETE FROM auth.users
    WHERE id IN (
        SELECT id FROM public.profiles 
        WHERE deletion_scheduled_at < now() - interval '30 days'
    );
$$);
```

### 3. Recovery Logic (Auth Lifecycle)
The `AuthContext` is responsible for "detecting" a returning user scheduled for deletion.

* **Trigger**: `onAuthStateChange` (Login event).
* **Action**: Fetch profile → check `deletion_scheduled_at` → call `ProfileService.cancelDeletion()`.
* **User Feedback**: A "Welcome Back" toast notification confirms the recovery.

---

## Technical Components

- **[ProfileService.ts](file:///home/apurbo/Projects/CostPilot/services/profileService.ts)**: Handles Supabase interactions for scheduling/cancelling.
- **[AccountDeletionModal.tsx](file:///home/apurbo/Projects/CostPilot/components/UI/AccountDeletionModal.tsx)**: The two-step verification UI.
- **[AuthContext.tsx](file:///home/apurbo/Projects/CostPilot/components/AuthContext.tsx)**: The guardian of the auto-recovery lifecycle.

## Privacy Considerations
- During the 30-day grace period, the developer has **zero access** to user data.
- The "Zero Access Policy" remains in effect until the moment of permanent hardware deletion.
- Metadata (deletion date) is the only additional data stored during this period.
