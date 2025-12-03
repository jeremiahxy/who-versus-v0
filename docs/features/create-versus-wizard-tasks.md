---
description: "Task list for Create Versus Wizard implementation"
---

# Tasks: Create Versus Wizard

**Input**: Design documents from `docs/features/` (spec.md, plan.md)
**Prerequisites**: Specification complete ✅, Implementation plan complete ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

Next.js App Router project structure:
- **Pages**: `app/` directory with nested folders
- **Components**: `components/` directory
- **Actions**: `app/actions/` directory
- **Types**: `types/` directory
- **Database**: `docs/database/` directory

---

## Phase 0: Database Migration (Shared Infrastructure)

**Purpose**: Update database schema before any code changes. This is a BLOCKING phase - no user story work can begin until complete.

**⚠️ CRITICAL**: Run these migrations in Supabase SQL Editor before proceeding to any user story implementation.

- [ ] M001 [US1] Create database migration script in `docs/database/migrations/2025-12-01-create-versus-wizard.sql`
- [ ] M002 [US1] Add `type` column to `versus` table: `ALTER TABLE versus ADD COLUMN type VARCHAR(50);`
- [ ] M003 [US1] Add `nickname` column to `versus_players` table: `ALTER TABLE versus_players ADD COLUMN nickname VARCHAR(50);`
- [ ] M004 [US1] Rename `name` to `title` in `objectives` table: `ALTER TABLE objectives RENAME COLUMN name TO title;` (if upgrading existing DB)
- [ ] M005 [US1] Add `description` column to `objectives` table: `ALTER TABLE objectives ADD COLUMN description TEXT;`
- [ ] M006 [US1] Run migration script in Supabase Dashboard SQL Editor
- [ ] M007 [US1] Verify migrations succeeded - check table structures in Supabase
- [ ] M008 [US1] Test existing app still works with new schema (home page, versus detail page)

**Checkpoint**: Database schema updated, TypeScript types already match. Ready for implementation.

---

## Phase 1: User Story 1 - Create Basic Versus with Manual Objectives (Priority: P1) 🎯 MVP

**Goal**: Core creation flow - user can create a Versus with commissioner-defined objectives

**Independent Test**: Click plus icon → complete all 3 steps → Versus appears on home page

### Backend Foundation (Blocking for US1)

- [x] T001 [P] [US1] Create `app/actions/suggestions.ts` with `generateObjectiveSuggestions()` function
  - Returns hardcoded array of 4 objectives
  - Function signature: `export async function generateObjectiveSuggestions(count: number): Promise<Array<{title: string, points: number, isPositive: boolean}>>`
  - Return data: Run 5 miles (+10), Do 20 pushups (+5), Attend yoga class (+8), Bike 15 miles (+15)

- [x] T002 [P] [US1] Add `validatePlayerEmail()` to `app/actions/players.ts`
  - Check if email exists in players table
  - Return player data if found (id, email, display_name) or null
  - Used for on-blur validation in Step 2

- [x] T003 [US1] Add `createVersusComplete()` to `app/actions/versus.ts` (depends on T001, T002)
  - Accept parameters: versusData (name, type, reverse_ranking, num_players), playersData (array of player objects with email, nickname, is_commissioner), objectivesData (array with title, points, description)
  - Step 1: Create versus record with `type` field
  - Step 2: Create versus_players records with `nickname` field
  - Step 3: Create objectives records with `title` and `description`
  - Use try-catch: if any step fails, manually delete created records (rollback)
  - Return `DbResult<Versus>` type
  - Log errors for debugging
  - Add revalidatePath('/') to refresh home page

**Checkpoint**: Backend functions ready for testing

### Wizard Step Components

- [x] T004 [P] [US1] Create `components/versus-wizard-step1.tsx` - Settings form
  - Props: `mode: 'create' | 'edit'`, `initialData?: Partial<Versus>`, `onSubmit: (data) => void`, `onCancel: () => void`
  - Fields: name (text input, 1-100 chars), type (dropdown: Scavenger Hunt, Fitness Challenge, Chore Competition, Swear Jar, Other), reverse_ranking (checkbox - conditional), number_of_players (number input, 1-12), objective_creation (radio buttons: Commissioner Defined, Have WhoVersus Suggest)
  - Conditional logic: `const showReverseRanking = type === "Swear Jar" || type === "Other"`
  - Default reverse_ranking: checked if Swear Jar, unchecked if Other
  - Validation: All required, name 1-100 chars
  - Mode: If edit, show "Save Changes" button instead of "Next"
  - Include helpful comments explaining conditional logic

- [x] T005 [P] [US1] Create `components/versus-wizard-step2.tsx` - Players form
  - Props: `mode: 'create' | 'edit'`, `initialData?: VersusPlayer[]`, `maxPlayers: number`, `currentUserId: string`, `onSubmit: (data) => void`, `onBack: () => void`, `onCancel: () => void`
  - Pre-render rows based on maxPlayers
  - Row 1: Pre-fill with current user (email, display_name from DB), mark as commissioner, disable all fields
  - Other rows: email input (validate on blur with validatePlayerEmail), display name/nickname input (auto-populate from DB or allow override), co-commissioner checkbox, three-dot menu with "Remove Player" option
  - Show counter: "Players: X / Y max"
  - "Invite New Player" button when current count < maxPlayers
  - On email blur: Call validatePlayerEmail(), show error if not found, auto-populate display name if found
  - Validation: No duplicate emails, at least 1 player (creator)
  - Include comments explaining auto-population logic

- [x] T006 [P] [US1] Create `components/versus-wizard-step3.tsx` - Objectives form
  - Props: `mode: 'create' | 'edit'`, `initialData?: Objective[]`, `creationMode: 'commissioner' | 'ai'`, `onSubmit: (data) => void`, `onBack: () => void`, `onCancel: () => void`
  - Commissioner mode: Show "Create New Objective" button
  - Objective form: title (text, 1-100 chars), positive/negative (dropdown, default Positive), points (number, 1-999999), description (textarea, 0-500 chars, optional)
  - Points calculation: If Negative selected, store points as negative number (multiply by -1)
  - Objective list: Display each as "Title - +X points - Description preview" with edit/delete buttons
  - Validation: At least 1 objective, max 12, title required
  - If mode=edit, show "Save Changes" instead of "Create Versus"
  - Include comments explaining +/- multiplication logic

**Checkpoint**: All components built and can be rendered independently

### Wizard State Management

- [x] T007 [US1] Create wizard state management solution
  - Option A: Create React Context in `app/create/layout.tsx` wrapping all create pages
  - Option B: Use URL search params to pass data between steps
  - Option C: Use React Hook Form with persistent storage
  - Recommended: React Context for simplicity
  - Store: versusData, playersData, objectivesData
  - Provide: updateVersusData, updatePlayersData, updateObjectivesData

### Creation Wizard Pages

- [x] T008 [US1] Create `app/create/page.tsx` - Step 1: Settings (depends on T004, T007)
  - Use `<VersusWizardStep1>` in create mode
  - On submit: Save to wizard context, navigate to `/create/players`
  - Back button: Disabled (first step)
  - Cancel button: Show confirmation "Discard changes and exit?", redirect to `/`
  - Include server action to get current user data

- [x] T009 [US1] Create `app/create/players/page.tsx` - Step 2: Players (depends on T005, T007, T008)
  - Get number_of_players and current user from context/parent
  - Use `<VersusWizardStep2>` in create mode with maxPlayers prop
  - On submit: Save to wizard context, navigate to `/create/objectives`
  - Back button: Navigate to `/create` preserving data
  - Cancel button: Show confirmation, redirect to `/`

- [x] T010 [US1] Create `app/create/objectives/page.tsx` - Step 3: Objectives (depends on T006, T007, T009)
  - Get objective_creation mode from context
  - Use `<VersusWizardStep3>` in create mode with commissioner creationMode
  - On submit: Call createVersusComplete() with all wizard data
  - Show loading state during creation
  - On success: Show toast "Versus '[name]' created successfully!", redirect to `/versus/[id]`
  - On error: Show error message with Retry button (keeps data)
  - Back button: Navigate to `/create/players` preserving data
  - Cancel button: Show confirmation, redirect to `/`

- [x] T011 [US1] Test full creation flow
  - Start at home page, click plus icon
  - Fill Step 1: name="Test Versus", type="Fitness Challenge", players=3, commissioner objectives
  - Fill Step 2: add 2 players with valid emails
  - Fill Step 3: add 3 objectives with varying points
  - Create Versus
  - Verify: Versus appears on home page, all players in DB, all objectives in DB

**Checkpoint**: MVP complete! Users can create Versus with manual objectives.

---

## Phase 2: User Story 2 - AI-Suggested Objectives (Priority: P2)

**Goal**: User can generate objectives using AI suggestions (mocked for MVP)

**Independent Test**: Create Versus with "Have WhoVersus Suggest" option

**Note**: Backend for AI already created in T001. Just need UI integration.

- [ ] T012 [US2] Update `components/versus-wizard-step3.tsx` to handle AI mode
  - When creationMode='ai': Show message "Click below to generate 4 starter objectives. You can add more after."
  - Show "Generate Objectives" button
  - On click: Call generateObjectiveSuggestions(), display results in editable form
  - After generation: Show message "Generated 4 starter objectives. You can add more below."
  - Show "Create New Objective" button to add additional objectives manually
  - User can edit or delete suggested objectives
  - Include comments explaining AI flow

- [ ] T013 [US2] Update `app/create/objectives/page.tsx` to pass AI mode
  - Check objective_creation from wizard context
  - Pass creationMode='ai' to VersusWizardStep3 if user selected "Have WhoVersus Suggest"

- [ ] T014 [US2] Test AI suggestion flow
  - Create Versus with "Have WhoVersus Suggest" selected
  - Click "Generate Objectives" on Step 3
  - Verify 4 objectives appear
  - Edit one objective (change points)
  - Add 5th objective manually
  - Create Versus
  - Verify all 5 objectives saved correctly

**Checkpoint**: AI suggestions working (mocked with 4 hardcoded objectives)

---

## Phase 3: User Story 3 - Conditional Reverse Ranking (Priority: P3)

**Goal**: Reverse ranking checkbox appears for Swear Jar and Other types

**Independent Test**: Select different types and verify checkbox visibility

**Note**: Logic already built into Step 1 component (T004). Just need testing.

- [ ] T015 [US3] Test reverse ranking conditional logic
  - Create Versus with type "Swear Jar" - verify checkbox appears and is checked by default
  - Change type to "Other" - verify checkbox appears and is unchecked by default
  - Change type to "Fitness Challenge" - verify checkbox disappears
  - Change type to "Scavenger Hunt" - verify checkbox disappears
  - Change type to "Chore Competition" - verify checkbox disappears

- [ ] T016 [US3] Test reverse ranking in scoreboard
  - Create Versus with reverse_ranking=true
  - Add objectives and players
  - Complete some objectives for different players
  - View scoreboard on `/versus/[id]` page
  - Verify player with lowest score ranks #1
  - Document: This may require updating the player_rankings view or scoreboard display logic if not already handling reverse ranking

**Checkpoint**: Reverse ranking conditional logic working correctly

---

## Phase 4: User Story 4 - Edit Players After Creation (Priority: P4)

**Goal**: Commissioner can manage players after Versus is created

**Independent Test**: Access "Manage Players" from home page, make changes

### Edit Pages

- [x] T017 [US4] Create `app/versus/[id]/players/page.tsx` - Edit Players
  - Fetch versus_players data for the Versus
  - Check if current user is commissioner (use is_user_commissioner function from RLS policies)
  - If not commissioner: Show error "Only commissioners can edit this Versus", link back to `/versus/[id]`
  - Use `<VersusWizardStep2>` in edit mode with initialData from DB
  - Get maxPlayers from versus record (may need to add this or calculate from existing players + allow more)
  - On submit: Update versus_players records (handle additions, removals, nickname changes, commissioner flag changes)
  - Save Changes button: Call update action, show success toast, stay on page or redirect to `/versus/[id]`
  - Cancel button: Return to `/versus/[id]` without saving

- [x] T018 [US4] Add `updateVersusPlayers()` to `app/actions/versus.ts`
  - Accept versus_id and array of player updates
  - Handle new players: Insert versus_players records
  - Handle removed players: Delete versus_players records
  - Handle updated players: Update nickname or is_commissioner flags
  - Verify user is commissioner before allowing updates
  - Use transaction or try-catch for atomic updates
  - Revalidate path `/versus/[id]`

### Home Page Commissioner Menu

- [x] T019 [P] [US4] Update `components/versus-card.tsx` to add commissioner menu
  - Add prop: `isCommissioner: boolean`
  - If isCommissioner, show three-dot menu icon (use shadcn DropdownMenu component)
  - Menu items:
    - "View Settings" → link to `/versus/[id]/settings`
    - "Manage Players" → link to `/versus/[id]/players`
    - "Manage Objectives" → link to `/versus/[id]/objectives`
  - If not commissioner, don't show menu
  - Style consistently with existing card design

- [x] T020 [US4] Update `app/page.tsx` to pass isCommissioner prop (depends on T019)
  - Modify getUserVersus() query to include is_commissioner check
  - Join with versus_players where player_id = current user
  - Pass isCommissioner boolean to VersusCard component
  - Test: Commissioner sees menu, non-commissioner doesn't

### Testing

- [x] T021 [US4] Test Edit Players flow
  - As commissioner, go to home page
  - Click three-dot menu on a Versus
  - Select "Manage Players"
  - Add a new player with valid email
  - Remove an existing player (not creator)
  - Change someone's nickname
  - Make someone a co-commissioner
  - Save changes
  - Verify: Changes reflected in DB and on Versus detail page

- [ ] T022 [US4] Test non-commissioner access
  - As non-commissioner player, attempt to access `/versus/[id]/players` directly via URL
  - Verify: Error message shown, cannot make changes
  - Verify: Three-dot menu not visible on home page for Versus they don't commission

**Checkpoint**: Commissioners can edit players, non-commissioners blocked

---

## Phase 5: User Story 5 - Edit Objectives After Creation (Priority: P4)

**Goal**: Commissioner can manage objectives after Versus is created

**Independent Test**: Access "Manage Objectives" from home page, make changes

### Edit Pages

- [x] T023 [US5] Create `app/versus/[id]/objectives/page.tsx` - Edit Objectives
  - Fetch objectives data for the Versus
  - Check if current user is commissioner
  - If not commissioner: Show error "Only commissioners can edit this Versus"
  - Use `<VersusWizardStep3>` in edit mode with initialData from DB
  - Show creationMode='commissioner' (no AI in edit mode)
  - On submit: Update objectives records (handle additions, modifications, deletions)
  - Save Changes button: Call update action, show success toast
  - Show warning: "Changing points will affect existing player scores"
  - Cancel button: Return to `/versus/[id]` without saving

- [x] T024 [US5] Add `updateVersusObjectives()` to `app/actions/objectives.ts`
  - Accept versus_id and array of objective updates
  - Handle new objectives: Insert objectives records
  - Handle removed objectives: Delete objectives records (will cascade delete completions)
  - Handle updated objectives: Update title, points, description
  - Verify user is commissioner before allowing updates
  - Use transaction or try-catch for atomic updates
  - Revalidate path `/versus/[id]`
  - Note: Scores will automatically recalculate via player_scores view

- [x] T025 [US5] Create `app/versus/[id]/settings/page.tsx` - Edit Settings
  - Fetch versus data
  - Check if current user is commissioner
  - Use `<VersusWizardStep1>` in edit mode with initialData
  - On submit: Update versus record (name, type, reverse_ranking)
  - Save Changes button: Call update action
  - Cancel button: Return to `/versus/[id]`
  - Note: Cannot change number_of_players after creation (just informational)

- [x] T026 [US5] Add `updateVersusSettings()` to `app/actions/versus.ts`
  - Accept versus_id and settings updates (name, type, reverse_ranking)
  - Verify user is commissioner
  - Update versus record
  - Revalidate path `/versus/[id]`

### Testing

- [x] T027 [US5] Test Edit Objectives flow
  - As commissioner, go to home page
  - Click three-dot menu, select "Manage Objectives"
  - Add new objective "Meditate for 10 minutes" (+5 points)
  - Edit existing objective: change points from 10 to 15
  - Delete an objective
  - Save changes
  - Verify: Changes in DB, scores recalculate correctly

- [x] T028 [US5] Test Edit Settings flow
  - As commissioner, click three-dot menu, select "View Settings"
  - Change name from "Test Versus" to "Updated Test"
  - Change type from "Fitness Challenge" to "Other"
  - Enable reverse ranking
  - Save changes
  - Verify: Changes reflected on Versus detail page

**Checkpoint**: Commissioners can edit all aspects of Versus after creation

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Refinement, validation, testing, and documentation

### UI/UX Polish

- [x] T029 [P] Add loading states to all wizard pages
  - Skeleton loaders while fetching data in edit mode
  - Spinner on "Create Versus" / "Save Changes" buttons during submission
  - Disable buttons during loading to prevent double-submit

- [x] T030 [P] Add comprehensive validation error messages
  - Email not found: "No account found with this email. Player must sign up first."
  - Duplicate email: "Player already invited to this Versus"
  - Name too short: "Name must be at least 1 character"
  - No objectives: "At least one objective required"
  - Review all error messages for clarity and actionability

- [ ] T031 [P] Add success/error toast notifications
  - Use shadcn Toast component throughout
  - Success: "Versus created successfully!", "Changes saved!"
  - Error: "Failed to create Versus. Please try again." with Retry button
  - Position toasts consistently (top-right recommended)
  - Note: Currently using inline error messages and success states. Toast library not installed.

- [ ] T032 [P] Test responsive design
  - Test all wizard pages on mobile (375px width)
  - Test on tablet (768px width)
  - Test on desktop (1920px width)
  - Ensure forms are usable, buttons reachable, text readable
  - Adjust layouts if needed for smaller screens

### Edge Cases & Validation

- [ ] T033 Test edge case: Navigate backward through wizard
  - Fill Step 1, go to Step 2, click Back
  - Verify: Step 1 data preserved
  - Fill Step 2, go to Step 3, click Back twice
  - Verify: All data preserved

- [ ] T034 Test edge case: Cancel wizard at each step
  - Step 1: Click Cancel, confirm dialog, verify return to home
  - Step 2: Enter data, click Cancel, confirm, verify no data saved
  - Step 3: Add objectives, click Cancel, confirm, verify no Versus created

- [ ] T035 Test edge case: Remove and re-add players
  - Step 2: Set max 5 players
  - Add 4 players
  - Remove 2 players
  - Verify: Counter shows "3 / 5 max"
  - Add 1 player back
  - Verify: Can add up to 5 total

- [ ] T036 Test edge case: Objectives with 0 points
  - Create objective with 0 points
  - Complete it
  - Verify: No score change, but completion tracked

- [ ] T037 Test edge case: Negative objectives
  - Create objective with Negative + 10 points = -10 stored
  - Complete it
  - Verify: Player score decreases by 10

- [ ] T038 Test database error handling
  - Simulate DB connection failure (disconnect internet or use invalid credentials temporarily)
  - Attempt to create Versus
  - Verify: Error message shown, retry button works, no partial data created

### Accessibility & Code Quality

- [x] T039 [P] Add accessibility attributes
  - ARIA labels on all form inputs
  - Keyboard navigation for wizard (Tab through fields, Enter to submit)
  - Focus management: After navigation, focus on first input
  - Screen reader testing recommended

- [x] T040 [P] Add comprehensive comments per constitution
  - Explain "why" for business logic (e.g., why reverse ranking, why +/- multiplication)
  - Document non-obvious patterns (wizard state management, dual-purpose components)
  - Add JSDoc comments on complex functions
  - Link to spec in component headers: "See docs/features/create-versus-wizard-spec.md"

- [x] T041 Run linter and fix issues
  - Run `npm run lint` or `pnpm lint`
  - Fix all errors and warnings
  - Ensure TypeScript has no type errors
  - Check for unused imports

### Documentation & Deployment

- [x] T042 Update `docs/database/IMPLEMENTATION_SUMMARY.md`
  - Add actual implementation completion date
  - Document any deviations from spec
  - Add "Create Versus Wizard" to implemented features list

- [ ] T043 Verify all Success Criteria from spec
  - SC-001: Time wizard completion (should be < 3 minutes)
  - SC-002: Test with new user (90% success rate target)
  - SC-003: Verify reverse ranking checkbox behavior
  - SC-004: Measure AI endpoint response time (should be < 500ms)
  - SC-005: Review all error messages for clarity
  - SC-006: Test back navigation data preservation
  - SC-007: Verify Versus appears on home immediately
  - SC-008: Check DB for all player records

- [ ] T044 Final code review
  - Review all new files against constitution principles
  - Check for file consolidation opportunities (can any components be combined?)
  - Ensure beginner-friendly code (clear names, helpful comments)
  - Verify no over-engineering or unnecessary complexity

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 0 (Database)**: No dependencies - START HERE ⚡
- **Phase 1 (US1)**: Depends on Phase 0 completion - BLOCKING for all other work
- **Phase 2 (US2)**: Depends on Phase 1 (T001 specifically for backend, T006 for component)
- **Phase 3 (US3)**: Depends on Phase 1 (T004 specifically) - can test anytime after T004
- **Phase 4 (US4)**: Depends on Phase 1 (T005 component) - can start after T005 complete
- **Phase 5 (US5)**: Depends on Phase 1 (T006 component) - can start after T006 complete
- **Phase 6 (Polish)**: Depends on all previous phases - FINAL PHASE

### Task Dependencies Within Phases

**Phase 1 (US1)**:
- T001, T002, T003: Backend (T003 depends on T001 & T002)
- T004, T005, T006: Components (all parallel, no dependencies)
- T007: State management (no dependencies)
- T008: Page 1 (depends on T004, T007)
- T009: Page 2 (depends on T005, T007, T008)
- T010: Page 3 (depends on T006, T007, T009)
- T011: Testing (depends on T008, T009, T010)

**Phase 2 (US2)**:
- T012: Component update (depends on T006)
- T013: Page update (depends on T010, T012)
- T014: Testing (depends on T013)

**Phase 4 (US4)**:
- T017, T018: Edit players page and action (parallel start, T017 needs T018 to test)
- T019: Component update (parallel with T017/T018)
- T020: Home page update (depends on T019)
- T021, T022: Testing (depends on T017-T020)

**Phase 5 (US5)**:
- T023, T024, T025, T026: Edit pages and actions (can work in parallel)
- T027, T028: Testing (depends on T023-T026)

### Parallel Opportunities

**Can work simultaneously**:
- T001, T002 (different files, backend)
- T004, T005, T006 (different component files)
- T017, T018, T019 (edit players page, action, card component)
- T023, T024, T025, T026 (edit objectives/settings pages and actions)
- All Phase 6 tasks marked [P] (polish tasks are independent)

---

## Implementation Strategy

### Sprint 1: MVP (1-2 weeks)

Complete Phase 0 and Phase 1 (US1) to deliver core value:
1. Day 1: Database migration (Phase 0)
2. Days 2-3: Backend functions (T001-T003)
3. Days 4-6: Components (T004-T006, T007)
4. Days 7-9: Wizard pages (T008-T010)
5. Day 10: Testing and fixes (T011)

**Deliverable**: Users can create Versus with manual objectives ✨

### Sprint 2: Enhanced Features (1 week)

Complete Phases 2-3 (US2, US3):
1. Days 1-2: AI integration (T012-T014)
2. Day 3: Reverse ranking testing (T015-T016)

**Deliverable**: AI suggestions and reverse ranking working

### Sprint 3: Commissioner Tools (1 week)

Complete Phases 4-5 (US4, US5):
1. Days 1-2: Edit players (T017-T022)
2. Days 3-4: Edit objectives and settings (T023-T028)

**Deliverable**: Full commissioner management capabilities

### Sprint 4: Polish (3-5 days)

Complete Phase 6:
1. Days 1-2: UI polish, loading states, toasts (T029-T032)
2. Days 3-4: Edge cases, accessibility (T033-T041)
3. Day 5: Final review and documentation (T042-T044)

**Deliverable**: Production-ready feature 🚀

---

## Notes

- [P] tasks can run in parallel - assign to different developers or tackle simultaneously
- Stop at any checkpoint to validate before proceeding
- Each user story should be independently testable after its phase completes
- Commit after each task or logical group of related tasks
- If Phase 1 takes longer than expected, consider splitting US1 into sub-phases
- Constitution reminder: If components are simple (< 200 lines), consider consolidating into fewer files

---

**Total Tasks**: 44 tasks across 6 phases
**Parallel Tasks**: 10 tasks can run simultaneously
**Critical Path**: M001-M008 → T001-T011 → T012-T044
**Estimated Time**: 16-22 hours (3-4 weeks part-time, 2-3 weeks full-time)

