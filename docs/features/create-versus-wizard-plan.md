# Implementation Plan: Create Versus Wizard

**Branch**: `create-versus-wizard` | **Date**: 2025-12-01 | **Spec**: [create-versus-wizard-spec.md](./create-versus-wizard-spec.md)

## Summary

Implement a multi-step wizard (Settings → Players → Objectives) for creating new Versus challenges. The wizard uses separate routes (`/create`, `/create/players`, `/create/objectives`) that can be reused as commissioner editing pages (`/versus/[id]/settings`, etc.). Includes commissioner menu on home page, email validation against existing players, optional nickname overrides, conditional reverse ranking, and mock AI objective suggestions.

## Technical Context

**Language/Version**: TypeScript with Next.js 14+ (App Router)  
**Primary Dependencies**: React, Next.js, Supabase (client + server), React Hook Form (recommended for wizard state)  
**Storage**: Supabase PostgreSQL with existing schema + 4 new columns  
**Testing**: Manual testing via browser (integration testing recommended)  
**Target Platform**: Web (responsive design for desktop and mobile)  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: < 500ms page navigation, < 3 minutes to complete wizard  
**Constraints**: Must validate emails against existing players table, atomic database transactions  
**Scale/Scope**: 49 functional requirements, 5 user stories, 10 new files, 4 modified files

## Constitution Check

✅ **Simplicity First**: Multi-step wizard is straightforward pattern, no over-engineering  
✅ **Code is Communication**: Spec includes extensive comments and beginner-friendly explanations  
✅ **File Consolidation**: 3 wizard step components could be in one file (recommend evaluation during implementation)  
✅ **Beginner-Friendly**: Clear variable names, well-documented functions, TypeScript types as documentation  
✅ **Practical Over Perfect**: MVP approach with mock AI, defer real AI to Phase 2  
✅ **Documentation Maintenance**: Database schema, types, and implementation summary already updated

**Complexity Notes**:
- Multi-step state management: Use React Context or form library (justified for UX)
- Dual-purpose components: Create/Edit modes share UI (justified for code reuse)
- Atomic transactions: Manual rollback required (justified for data consistency)

## Project Structure

### Documentation (this feature)

```text
docs/features/
├── create-versus-wizard-spec.md     ✅ Complete
├── create-versus-wizard-plan.md     ✅ This file
└── create-versus-wizard-tasks.md    ⏳ Created by /speckit.tasks (not yet created)
```

### Source Code (repository root)

```text
app/
├── page.tsx                          # Home page - ADD commissioner menu
├── create/
│   ├── page.tsx                      # NEW: Step 1 - Settings
│   ├── players/
│   │   └── page.tsx                  # NEW: Step 2 - Set Players
│   └── objectives/
│       └── page.tsx                  # NEW: Step 3 - Set Objectives
├── versus/
│   └── [id]/
│       ├── settings/
│       │   └── page.tsx              # NEW: Edit Settings (reuses Step 1)
│       ├── players/
│       │   └── page.tsx              # NEW: Edit Players (reuses Step 2)
│       └── objectives/
│           └── page.tsx              # NEW: Edit Objectives (reuses Step 3)
└── actions/
    ├── versus.ts                     # MODIFY: Add createVersusComplete()
    └── suggestions.ts                # NEW: Mock AI suggestions endpoint

components/
├── versus-card.tsx                   # MODIFY: Add commissioner menu
├── versus-wizard-step1.tsx           # NEW: Settings form component
├── versus-wizard-step2.tsx           # NEW: Players form component
└── versus-wizard-step3.tsx           # NEW: Objectives form component

types/
└── database.ts                       # ✅ Already updated with new fields

docs/database/
├── supabase-schema.sql               # ✅ Already updated with new columns
└── IMPLEMENTATION_SUMMARY.md         # ✅ Already documented changes
```

**Structure Decision**: Using separate files for each wizard step component provides clear organization. Could consolidate into single file if components are simple (< 200 lines each). Recommend separate files initially, consolidate if warranted after implementation.

## Complexity Tracking

No violations requiring justification. All complexity is well-justified by UX requirements and data consistency needs.

## Implementation Phases

### Phase 0: Database Migration (Prerequisites)

**Purpose**: Update database schema with new columns required by the wizard

**Tasks**:
- [ ] **M001** Run database migration to add `type` column to `versus` table
- [ ] **M002** Run database migration to add `nickname` column to `versus_players` table
- [ ] **M003** Run database migration to rename `name` to `title` in `objectives` table (if upgrading existing DB)
- [ ] **M004** Run database migration to add `description` column to `objectives` table
- [ ] **M005** Verify migrations succeeded in Supabase Dashboard
- [ ] **M006** Test that existing data still loads correctly with new schema

**Checkpoint**: Database schema updated and verified. TypeScript types already match new schema.

---

### Phase 1: Server Actions & Mock Endpoint

**Purpose**: Create backend functions before building UI

**Tasks**:
- [ ] **B001** Create `app/actions/suggestions.ts` with `generateObjectiveSuggestions()` function
  - Returns 4 hardcoded objectives regardless of input
  - Function signature: `(count: number) => Promise<Objective[]>`
  - Return: Run 5 miles (+10), Do 20 pushups (+5), Attend yoga class (+8), Bike 15 miles (+15)

- [ ] **B002** Add `createVersusComplete()` to `app/actions/versus.ts`
  - Accepts: versus data, players array, objectives array
  - Creates versus record with type and reverse_ranking
  - Creates versus_players records with nicknames and is_commissioner flags
  - Creates objectives records with title, points, description
  - Uses try-catch with manual rollback on any error
  - Returns: `DbResult<Versus>` with new versus or error

- [ ] **B003** Add `validatePlayerEmail()` helper to `app/actions/players.ts`
  - Checks if email exists in players table
  - Returns player data if found, null if not
  - Used by wizard to validate emails on blur

- [ ] **B004** Test server actions with manual calls or API testing tool

**Checkpoint**: Backend functions ready for UI integration

---

### Phase 2: Wizard Step Components (Core UI)

**Purpose**: Build reusable form components for each wizard step

#### Step 1: Settings Component

- [ ] **C001** Create `components/versus-wizard-step1.tsx`
  - Prop: `mode: 'create' | 'edit'`, `initialData?: Partial<Versus>`
  - Fields: name (text), type (dropdown with 5 options), reverse_ranking (conditional checkbox), number_of_players (1-12), objective_creation (radio: Commissioner/AI)
  - Validation: name required (1-100 chars), all fields required
  - Conditional logic: Show reverse_ranking only for "Swear Jar" or "Other"
  - Default reverse_ranking: checked for "Swear Jar", unchecked for "Other"
  - Export both form component and validation schema

#### Step 2: Players Component

- [ ] **C002** Create `components/versus-wizard-step2.tsx`
  - Prop: `mode: 'create' | 'edit'`, `initialData?: VersusPlayer[]`, `maxPlayers: number`
  - Pre-render rows based on maxPlayers
  - Row 1 (creator): Pre-filled, locked email/name, commissioner checked and locked
  - Other rows: email input with validation, display name (auto-populate from DB), nickname override, co-commissioner checkbox, three-dot menu with Remove
  - Counter display: "Players: X / Y max"
  - "Invite New Player" button when < maxPlayers
  - Validation: Email exists in DB (on blur), no duplicates, at least 1 player
  - Call `validatePlayerEmail()` on email blur to auto-populate display name

#### Step 3: Objectives Component

- [ ] **C003** Create `components/versus-wizard-step3.tsx`
  - Prop: `mode: 'create' | 'edit'`, `initialData?: Objective[]`, `creationMode: 'commissioner' | 'ai'`
  - Commissioner mode: "Create New Objective" button, objective form (title, +/- dropdown, points, description)
  - AI mode: "Generate Objectives" button, message about 4 starter objectives
  - After generation: Editable objective list, "Create New Objective" button to add more
  - Objective list: Display title, points (+/-), description preview, edit/delete buttons
  - Validation: At least 1 objective, max 12, title required (1-100 chars), points required (0-999999)
  - Points calculation: +/- dropdown multiplies points value before storing

**Checkpoint**: All three step components built and independently testable

---

### Phase 3: Wizard Pages (Creation Flow)

**Purpose**: Wire up step components into creation wizard flow

- [ ] **P001** Create `app/create/page.tsx` (Step 1)
  - Render `<VersusWizardStep1>` in create mode
  - Back button: disabled
  - Next button: Validates and navigates to `/create/players`
  - Cancel button: Confirmation dialog, redirects to home
  - Store form data in React Context or component state (passed via URL params or context)

- [ ] **P002** Create `app/create/players/page.tsx` (Step 2)
  - Get number_of_players from Step 1 (context or URL params)
  - Render `<VersusWizardStep2>` in create mode with maxPlayers prop
  - Back button: Returns to `/create` with data preserved
  - Next button: Validates and navigates to `/create/objectives`
  - Cancel button: Confirmation dialog, redirects to home

- [ ] **P003** Create `app/create/objectives/page.tsx` (Step 3)
  - Get objective_creation mode from Step 1
  - Render `<VersusWizardStep3>` in create mode with creationMode prop
  - Back button: Returns to `/create/players` with data preserved
  - Create Versus button: Calls `createVersusComplete()` with all wizard data
  - On success: Show toast notification, redirect to `/versus/[id]`
  - On error: Show error message with Retry button
  - Cancel button: Confirmation dialog, redirects to home

- [ ] **P004** Implement wizard state management
  - Option A: React Context Provider wrapping all `/create/*` pages
  - Option B: Pass data via URL search params (serialized)
  - Option C: Use form library like React Hook Form with persistent storage
  - Choose simplest approach that preserves data across navigation

**Checkpoint**: Full creation wizard flow working end-to-end

---

### Phase 4: Edit Pages (Commissioner Management)

**Purpose**: Reuse step components for post-creation editing

- [ ] **E001** Create `app/versus/[id]/settings/page.tsx`
  - Fetch existing versus data from database
  - Verify user is commissioner (show error if not)
  - Render `<VersusWizardStep1>` in edit mode with initialData
  - Save Changes button: Updates versus record
  - Cancel button: Returns to `/versus/[id]`
  - Show success toast on save

- [ ] **E002** Create `app/versus/[id]/players/page.tsx`
  - Fetch existing versus_players data
  - Verify user is commissioner
  - Render `<VersusWizardStep2>` in edit mode with initialData
  - Save Changes button: Updates versus_players records
  - Handle additions (new players) and removals
  - Cancel button: Returns to `/versus/[id]`

- [ ] **E003** Create `app/versus/[id]/objectives/page.tsx`
  - Fetch existing objectives data
  - Verify user is commissioner
  - Render `<VersusWizardStep3>` in edit mode with initialData
  - Save Changes button: Updates objectives records
  - Handle additions, modifications, deletions
  - Note: Point changes will affect existing player scores (document in UI)
  - Cancel button: Returns to `/versus/[id]`

**Checkpoint**: All edit pages functional, commissioner-only access enforced

---

### Phase 5: Home Page Commissioner Menu

**Purpose**: Add quick access to management pages from home page

- [ ] **H001** Modify `components/versus-card.tsx`
  - Add three-dot menu icon (show only if current user is commissioner)
  - Menu items: "View Settings", "Manage Players", "Manage Objectives"
  - Link to: `/versus/[id]/settings`, `/versus/[id]/players`, `/versus/[id]/objectives`
  - Use shadcn DropdownMenu component for consistency

- [ ] **H002** Update home page query to include is_commissioner flag
  - Modify query in `app/page.tsx` to join versus_players and check commissioner status
  - Pass `isCommissioner` prop to `<VersusCard>` component

**Checkpoint**: Commissioner menu visible and functional on home page

---

### Phase 6: Polish & Testing

**Purpose**: Refinement, validation, and user experience improvements

- [ ] **T001** Add loading states to all forms (skeleton loaders during data fetch)
- [ ] **T002** Add form validation error messages with clear, actionable text
- [ ] **T003** Add success/error toast notifications throughout wizard
- [ ] **T004** Test responsive design on mobile/tablet (ensure forms are usable)
- [ ] **T005** Test all edge cases documented in spec (see spec Edge Cases section)
- [ ] **T006** Test commissioner permissions (non-commissioners cannot access edit pages)
- [ ] **T007** Test atomic transactions (verify rollback works on error)
- [ ] **T008** Add accessibility attributes (ARIA labels, keyboard navigation)
- [ ] **T009** Update navigation component if needed (ensure plus icon routes to `/create`)
- [ ] **T010** Code cleanup and add comments per constitution (explain "why", not just "what")
- [ ] **T011** Run linter and fix any issues
- [ ] **T012** Update documentation if any implementation decisions differ from spec

**Checkpoint**: Feature complete, tested, and polished

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Phase 0 (Database)**: No dependencies - can start immediately ⚡ **START HERE**
2. **Phase 1 (Server Actions)**: Depends on Phase 0 completion
3. **Phase 2 (Components)**: Can start in parallel with Phase 1 (components don't need working backend for UI development)
4. **Phase 3 (Wizard Pages)**: Depends on Phases 1 & 2 completion
5. **Phase 4 (Edit Pages)**: Depends on Phase 2 completion (can run parallel to Phase 3)
6. **Phase 5 (Home Menu)**: Depends on Phase 4 completion (needs edit pages to link to)
7. **Phase 6 (Polish)**: Depends on all previous phases

### Critical Path

```
Phase 0 (Database) 
    ↓
Phase 1 (Backend) + Phase 2 (Components - can overlap)
    ↓
Phase 3 (Wizard Pages) → Test creation flow
    ↓
Phase 4 (Edit Pages) → Test editing flow
    ↓
Phase 5 (Home Menu) → Test commissioner access
    ↓
Phase 6 (Polish & Testing) → Feature complete
```

### Parallel Opportunities

- **Phase 1 & 2**: Backend and UI components can be developed simultaneously
- **Phase 3 & 4**: Wizard pages and edit pages can be developed in parallel after components are ready
- **Within Phase 2**: All three step components can be built in parallel (C001, C002, C003)
- **Within Phase 6**: All testing tasks can run in parallel if multiple testers available

## User Story Mapping to Phases

- **User Story 1 (P1 - MVP)**: Phases 0, 1, 2, 3 (core creation flow)
- **User Story 2 (P2)**: Phase 1 (AI endpoint already included), Phase 2-3 (mode already built)
- **User Story 3 (P3)**: Phase 2 (conditional logic in Step 1 component)
- **User Story 4 (P4)**: Phases 2, 4, 5 (edit players + home menu)
- **User Story 5 (P4)**: Phases 2, 4, 5 (edit objectives + home menu)

## Implementation Strategy

### MVP First (Recommended)

Focus on User Story 1 (P1) to get core functionality working:

1. Complete Phase 0 (Database) - ~30 minutes
2. Complete Phase 1 (Backend) - ~2-3 hours
3. Complete Phase 2 (Components) - ~4-6 hours
4. Complete Phase 3 (Wizard Pages) - ~2-3 hours
5. Basic testing - ~1 hour

**Total MVP Time**: ~10-14 hours

At this point, users can create Versus with manual objectives. Ship MVP and gather feedback before adding edit features.

### Full Feature (All User Stories)

Complete all phases:

1. MVP (Phases 0-3) - ~10-14 hours
2. Edit features (Phase 4) - ~3-4 hours
3. Home menu (Phase 5) - ~1 hour
4. Polish & testing (Phase 6) - ~2-3 hours

**Total Full Feature Time**: ~16-22 hours

### Recommended Approach

**Week 1**: MVP only (Phases 0-3)
- Deploy and test with real users
- Gather feedback on creation flow
- Identify issues before building edit features

**Week 2**: Edit features and polish (Phases 4-6)
- Add commissioner management pages
- Add home page menu
- Polish based on user feedback

## Risk Mitigation

### High-Risk Areas

1. **Wizard state management**: Data must persist across page navigation
   - Mitigation: Test back navigation thoroughly, use battle-tested state solution

2. **Email validation timing**: On-blur validation could be slow
   - Mitigation: Debounce validation calls, show loading indicator

3. **Atomic transactions**: Database rollback logic could fail
   - Mitigation: Test error scenarios explicitly, log all errors

4. **Dual-purpose components**: Create/edit mode logic could be confusing
   - Mitigation: Use clear prop names, document mode behavior, test both modes

### Testing Strategy

- **Manual testing**: Each phase has checkpoint - test before moving on
- **Edge case testing**: Use spec Edge Cases section as test script
- **Permission testing**: Verify commissioners-only access to edit pages
- **Error testing**: Intentionally trigger errors to verify handling

## Success Criteria Validation

After implementation, verify against spec Success Criteria:

- [ ] SC-001: User completes wizard in < 3 minutes (time actual usage)
- [ ] SC-002: 90% success rate for first-time users (track errors)
- [ ] SC-003: Reverse ranking checkbox appears/disappears correctly (test all types)
- [ ] SC-004: AI endpoint returns in < 500ms (measure actual time)
- [ ] SC-005: Validation errors are clear (review all error messages)
- [ ] SC-006: Back navigation preserves data (test all back button clicks)
- [ ] SC-007: Created Versus appears on home page (verify immediately after creation)
- [ ] SC-008: All players receive database records (check versus_players table)

## Notes

- Constitution principle: Prefer consolidation - consider combining step components into one file if each is < 200 lines
- Database migration must run before any code changes
- Test commissioner permissions thoroughly - security requirement
- Document any deviations from spec in this plan
- Update `docs/database/IMPLEMENTATION_SUMMARY.md` with actual implementation dates after completion

---

**Ready to implement!** Start with Phase 0 (database migration) and proceed sequentially through phases. Use checkpoints to validate before moving forward.

