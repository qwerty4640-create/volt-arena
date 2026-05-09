# Security Spec - Berserker Workouts

## 1. Data Invariants
- A UserProfile must be owned by the authenticated user and have a valid email.
- A WorkoutSession must belong to the user (`uid` matches `request.auth.uid`).
- Immutable fields (`uid`, `id`, `createdAt`) cannot be changed after creation.
- Timestamps must be integers (milliseconds since epoch).
- Arrays (like `exercises` or `sets`) must have bounded sizes to prevent denial-of-wallet attacks.

## 2. The "Dirty Dozen" Payloads

### P1: Identity Spoofing (Create workout for another user)
Payload: `{ "id": "w1", "uid": "other_user_id", "title": "Stolen Workout", ... }`
Expected: `PERMISSION_DENIED`

### P2: Privilege Escalation (Set self as admin)
Payload: `{ "role": "admin", ... }` added to UserProfile.
Expected: `PERMISSION_DENIED`

### P3: Resource Poisoning (Huge ID)
Path: `users/uid/workouts/a_very_long_id_exceeding_128_characters...`
Expected: `PERMISSION_DENIED` (via `isValidId`)

### P4: State Shortcutting (Update workout status without owner)
Request: Authenticated as User B, try to update User A's workout.
Expected: `PERMISSION_DENIED`

### P5: Immortal Field Mutation (Change uid or id)
Payload: `{ "uid": "new_uid", ... }` on an existing workout.
Expected: `PERMISSION_DENIED`

### P6: PII Leak (Read another user's profile)
Request: User A reads `/users/UserB`.
Expected: `PERMISSION_DENIED` (unless User A is Admin).

### P7: Value Poisoning (Invalid type for volume)
Payload: `{ "volume": "not_a_number", ... }`
Expected: `PERMISSION_DENIED`

### P8: Shadow Field Injection
Payload: `{ "isVerified": true, ... }` on a collection that doesn't allow `isVerified`.
Expected: `PERMISSION_DENIED` (via `hasOnly` on update actions).

### P9: Denial of Wallet (Huge exercises array)
Payload: `{ "exercises": [ ... 5000 items ... ] }`
Expected: `PERMISSION_DENIED`

### P10: Orphaned Write (Create workout with random ID but no matching fields)
Payload: `{ "someRandomField": "value" }`
Expected: `PERMISSION_DENIED` (via `isValidWorkout`)

### P11: Timestamp Spoofing (Future timestamp)
Payload: `{ "completedAt": 9999999999999 }`
Expected: `PERMISSION_DENIED` (if using strict temporal validation).

### P12: Global Resource Access (List all workouts across all users)
Query: `db.collectionGroup('workouts').get()`
Expected: `PERMISSION_DENIED`

## 3. Test Runner Concept
The tests will ensure that each of these malicious payloads is rejected by the rules defined in `firestore.rules`.
