# Systematic Debugging Plan - Al Imran Tense Learner

## Goal
Systematically resolve critical functional bugs in Battle, Daily Tests, and Shop modules, followed by a comprehensive technical debt/linting cleanup.

## Phase 1: High-Impact Functional Fixes
- [ ] **Battle Arena Sync**: Implement real-time score synchronization and fix premature winner calculation in `src/app/(app)/battle/page.tsx`.
- [ ] **Daily Test Persistence**: Migrate `prevScore` and `prevTotal` from component state to `gameStore.ts` to ensure adaptive difficulty survives refreshes.
- [ ] **Shop Persistence**: Fix non-UUID avatar persistence by adding a `slug` field or mapping logic in `user_purchases` table and `ShopPage.tsx`.
- [ ] **Progression Integrity**: Add error handling and `await` to `updateXP` and `completeTopic` in `gameStore.ts`.

## Phase 2: Technical Debt & Linting
- [ ] **Type Safety**: Replace `any` types in `gameStore.ts` (especially `activeChannel`) with explicit Supabase interfaces.
- [ ] **Linting Batch**: Address top 50 priority lint errors (missing `alt` tags, unused imports, explicit `any` in components).
- [ ] **Final Audit**: Run `python .agent/scripts/checklist.py .` to verify project-wide compliance.

## Done When
- [ ] 1v1 Battle scores sync in real-time between two browser sessions.
- [ ] Daily test adaptive difficulty remains consistent after page reload.
- [ ] All purchased avatars remain "Owned" after page refresh.
- [ ] `npm run lint` returns 0 critical errors.

## Notes
- Battle sync requires adding a `postgres_changes` listener for the `battles` table in the `gameStore` or `BattlePage`.
- Shop fix might require a migration if we decide to change the schema to support non-UUID slugs.
