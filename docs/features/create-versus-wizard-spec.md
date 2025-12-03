# Feature Specification: Create Versus Wizard

**Feature Branch**: `create-versus-wizard`  
**Created**: 2025-12-01  
**Updated**: 2025-12-01  
**Status**: Ready for Implementation  
**Routes**: `/create`, `/create/players`, `/create/objectives` (triggered by plus icon in header)

## Overview

A multi-step form wizard that guides users through creating a new Versus (game/challenge). The wizard consists of three steps with separate routes: Settings (`/create`), Players (`/create/players`), and Objectives (`/create/objectives`). Each page serves dual purpose as both creation wizard step and commissioner editing page (e.g., `/versus/[id]/players` for editing).

## Clarifications & Decisions

**Player Accounts**: All invited players must have existing WhoVersus accounts. Email validation checks against the `players` table. Future: email invitations for non-users.

**Creator Inclusion**: Creator is automatically Player #1 (pre-filled, commissioner, cannot be removed). "Number of Players" includes creator (e.g., "3 players" = creator + 2 others).

**Display Names**: Use existing `display_name` from players table, with optional Versus-specific nickname override stored in `versus_players.nickname` column (NEW).

**Commissioner Menu**: On home page, commissioners see three-dot menu on their Versus with options: "View Settings", "Manage Players", "Manage Objectives". Non-commissioners don't see menu.

**Navigation**: Uses separate routes (`/create`, `/create/players`, `/create/objectives`) to enable reuse as edit pages (`/versus/[id]/players`).

**Objective Points**: +/- dropdown multiplies points value. "Negative" + "10 points" = -10 stored in database.

## User Scenarios & Testing

### User Story 1 - Create Basic Versus with Manual Objectives (Priority: P1) 🎯 MVP

A commissioner wants to quickly set up a custom challenge with their own objectives and invite specific players.

**Why this priority**: Core creation flow - without this, users cannot create any Versus at all. This is the foundation of the entire application.

**Independent Test**: User can click the plus icon, go through all three steps, and create a fully functional Versus that appears on their home page with all players invited.

**Acceptance Scenarios**:

1. **Given** user is logged in and on any page, **When** they click the plus icon in header, **Then** they navigate to `/create` showing Step 1 (Versus Settings)

2. **Given** user is on Step 1, **When** they enter name "Summer Fitness", select type "Fitness Challenge", set 3 players (including themselves), choose "Commissioner Defined" objectives, and click Next, **Then** they proceed to `/create/players` (Step 2)

3. **Given** user is on Step 2, **When** they see themselves pre-filled as Player #1 (commissioner), enter emails and display names for 2 additional players, mark one as co-commissioner, and click Next, **Then** they proceed to `/create/objectives` (Step 3)

4. **Given** user is on Step 3, **When** they create 3 objectives with titles, points, and +/- designation, and click Create Versus, **Then** the Versus is created in database, all players are invited, and user is redirected to the new Versus page

5. **Given** user completes the wizard, **When** they check their home page, **Then** the new Versus appears in their list with correct name and 0/0 score

---

### User Story 2 - Create Versus with AI-Suggested Objectives (Priority: P2)

A commissioner wants to quickly create a Versus using suggested objectives rather than manually defining each one.

**Why this priority**: Reduces friction for new users who may not know what objectives to create. Makes onboarding faster and easier.

**Independent Test**: User can create a Versus by choosing "Have WhoVersus Suggest" and receive 4 pre-populated objectives that they can then accept or modify.

**Acceptance Scenarios**:

1. **Given** user is on Step 1, **When** they select "Have WhoVersus Suggest" for Objective Creation and complete Steps 1-2, **Then** on Step 3 (`/create/objectives`) they see message "Click below to generate 4 starter objectives" and a "Generate Objectives" button

2. **Given** user is on Step 3 with AI mode, **When** they click "Generate Objectives", **Then** the system displays 4 suggested objectives: "Run 5 miles" (+10), "Do 20 pushups" (+5), "Attend yoga class" (+8), "Bike 15 miles" (+15), with message "Generated 4 starter objectives. You can add more below."

3. **Given** user sees suggested objectives, **When** they can edit titles, points, or +/- values before clicking Create Versus, **Then** the modified objectives are saved with the new Versus

---

### User Story 3 - Conditional Reverse Ranking (Priority: P3)

A commissioner creating a "Swear Jar" or other negative-point Versus wants the ranking to work in reverse (lowest score wins).

**Why this priority**: Specific use case for penalty-based games. Nice to have but not essential for MVP.

**Independent Test**: User creates a "Swear Jar" Versus and confirms that the Reverse Ranking checkbox appears and is pre-checked.

**Acceptance Scenarios**:

1. **Given** user is on Step 1, **When** they select Type "Swear Jar", **Then** the "Reverse Ranking" checkbox appears and is checked by default

2. **Given** user is on Step 1, **When** they select Type "Other", **Then** the "Reverse Ranking" checkbox appears and is unchecked by default

3. **Given** user is on Step 1, **When** they select Type "Fitness Challenge", "Scavenger Hunt", or "Chore Competition", **Then** the "Reverse Ranking" checkbox does not appear

4. **Given** user creates a Versus with Reverse Ranking enabled, **When** viewing the scoreboard, **Then** the player with the lowest score ranks #1

---

### User Story 4 - Edit Players After Creation (Priority: P4)

A commissioner wants to add, remove, or modify player permissions after the Versus has been created.

**Why this priority**: Addresses real-world scenario where player lists change. Important but not required for initial creation.

**Independent Test**: Commissioner can access the Players page from the home page Versus list and make changes that are immediately reflected.

**Acceptance Scenarios**:

1. **Given** commissioner is on home page viewing their Versus list, **When** they click the three-dot menu on a Versus they commission and select "Manage Players", **Then** they navigate to `/versus/[id]/players` showing all current players with their roles

2. **Given** commissioner is on `/versus/[id]/players`, **When** they click the three-dot menu on a player row and select "Remove", **Then** confirmation dialog appears, and on confirm that player is removed from the Versus

3. **Given** commissioner is editing players with fewer than 12 players and sees "Players: 5 / 12 max", **When** they click "Invite New Player", **Then** a new blank player row appears for email/display name entry

---

### User Story 5 - Edit Objectives After Creation (Priority: P4)

A commissioner wants to add, modify, or remove objectives after the Versus has been created.

**Why this priority**: Flexibility for adjusting game rules. Important for long-running Versus but not essential for MVP.

**Independent Test**: Commissioner can access the Objectives page from an existing Versus and make changes that update scoring calculations.

**Acceptance Scenarios**:

1. **Given** commissioner is viewing an existing Versus, **When** they navigate to Edit Objectives (same UI as Step 3), **Then** they see all current objectives

2. **Given** commissioner is editing objectives, **When** they modify an objective's points value, **Then** all player scores recalculate based on their existing completions

3. **Given** commissioner is editing objectives and fewer than 12 objectives exist, **When** they click "Create New Objective", **Then** the objective creation form appears

---

### Edge Cases

- What happens when user navigates backward through wizard? **Back button available, preserves entered data in state**
- How does system handle duplicate player emails? **Validate and show error: "Player already invited to this Versus"**
- What if user enters email that doesn't exist in system? **Validate against players table, show error: "No account found with this email. Player must sign up first."**
- What if user leaves wizard without completing? **Show confirmation dialog on Cancel/exit. No Versus created, no data saved.**
- Can a commissioner remove themselves? **No - creator (Player #1) cannot be removed. Other commissioners can remove themselves if at least one commissioner remains.**
- What happens if user tries to create Versus with 0 objectives? **Block creation, show error: "At least one objective required"**
- How many players can be commissioners? **All players can be commissioners if desired (no limit)**
- Can objectives have 0 points? **Yes - for tracking completion without affecting score**
- What's the maximum point value? **999,999 to prevent overflow**
- What if player sets "3 players" then removes 2 in Step 2? **Valid - shows "Players: 1 / 3 max". Can add back up to maximum.**
- Can user change number of players after Step 1? **Yes - use Back button or edit via "View Settings" later**
- What if nickname field is left empty? **Use display_name from players table as fallback**

## Requirements

### Functional Requirements

#### Step 1: Versus Settings

- **FR-001**: System MUST provide text input for Versus name (required, 1-100 characters)
- **FR-002**: System MUST provide dropdown for Type with exactly 5 options: "Scavenger Hunt", "Fitness Challenge", "Chore Competition", "Swear Jar", "Other"
- **FR-003**: System MUST show "Reverse Ranking" checkbox ONLY when Type is "Swear Jar" or "Other"
- **FR-004**: System MUST default "Reverse Ranking" to checked for "Swear Jar" and unchecked for "Other"
- **FR-005**: System MUST provide number input for "Number of Players" (required, 1-12)
- **FR-006**: System MUST provide radio buttons for "Objective Creation": "Commissioner Defined" or "Have WhoVersus Suggest"
- **FR-007**: System MUST validate all required fields before allowing progression to Step 2
- **FR-008**: System MUST persist Step 1 data when user navigates to Step 2

#### Step 2: Set Players

- **FR-009**: System MUST display input rows equal to "Number of Players" from Step 1 (pre-rendered)
- **FR-009a**: System MUST pre-fill Player #1 row with creator's email and display_name (locked, cannot be removed)
- **FR-009b**: System MUST automatically check "Commissioner" checkbox for Player #1 (locked)
- **FR-010**: Each player row MUST have: email input (required, valid email), display name/nickname input (optional, 1-50 chars), co-commissioner checkbox, three-dot menu
- **FR-010a**: System MUST validate email exists in players table, show error if not found: "No account found with this email. Player must sign up first."
- **FR-010b**: If email exists, system MUST auto-populate display name field with player's current display_name
- **FR-010c**: User MAY override display name with Versus-specific nickname (stored in versus_players.nickname)
- **FR-010d**: If nickname field empty, system MUST use display_name from players table
- **FR-011**: Three-dot menu MUST have "Remove Player" option (disabled for Player #1/creator)
- **FR-011a**: Removing player shows confirmation, then removes row (frees slot in max count)
- **FR-012**: System MUST show "Invite New Player" button when current players < max players from Step 1
- **FR-012a**: System MUST display counter: "Players: X / Y max" where Y is from Step 1
- **FR-013**: System MUST validate no duplicate emails across all player rows, show error: "Player already invited to this Versus"
- **FR-014**: System MUST validate at least 1 player (the creator minimum) before allowing progression to Step 3
- **FR-015**: System MUST persist Step 2 data when user navigates to `/create/objectives`

#### Step 3: Set Objectives (Commissioner Defined Mode)

- **FR-016**: System MUST show "Create New Objective" button when in Commissioner Defined mode
- **FR-017**: Objective form MUST have: Title input (required, 1-100 chars), Positive/Negative dropdown (required, default "Positive"), Points input (required, 1-999999), Description textarea (optional, 0-500 chars)
- **FR-017a**: Points input MUST accept positive integers only (1-999999)
- **FR-017b**: +/- dropdown MUST multiply points value: "Positive" stores as entered, "Negative" stores as negative value
- **FR-017c**: Example: "Negative" + "10 points" = -10 stored in database
- **FR-017d**: System MUST allow 0 points for tracking-only objectives (no score impact)
- **FR-018**: System MUST limit total objectives to 12 per Versus
- **FR-019**: System MUST validate at least 1 objective exists before allowing Versus creation
- **FR-020**: Objective list MUST display each objective as: "Title" - "+X points" or "-X points" - "Description preview"
- **FR-021**: System MUST allow editing and deleting objectives before final creation

#### Step 3: Set Objectives (AI Suggested Mode)

- **FR-022**: System MUST show "Generate Objectives" button when in AI Suggested mode (no count dropdown - future feature)
- **FR-023**: System MUST display message: "Click below to generate 4 starter objectives. You can edit them or add more after."
- **FR-024**: Mock endpoint MUST return exactly 4 objectives regardless of Versus type:
  - "Run 5 miles" - Positive - 10 points
  - "Do 20 pushups" - Positive - 5 points
  - "Attend yoga class" - Positive - 8 points
  - "Bike 15 miles" - Positive - 15 points
- **FR-025**: After generation, system MUST display message: "Generated 4 starter objectives. You can add more below."
- **FR-026**: System MUST display generated objectives in editable form (same UI as Commissioner Defined mode)
- **FR-027**: User MUST be able to edit any suggested objective (title, points, +/-, description) before creating Versus
- **FR-028**: User MUST be able to delete suggested objectives
- **FR-029**: User MUST be able to add additional objectives after generation (up to 12 total via "Create New Objective" button)

#### Wizard Navigation & UI

- **FR-030**: Each wizard step MUST have "Back" button (left) and "Next"/"Create Versus" button (right)
- **FR-030a**: Back button disabled on Step 1 (`/create`)
- **FR-030b**: "Next" button on Steps 1-2, "Create Versus" button on Step 3
- **FR-031**: Each wizard step MUST have "Cancel" link (top-right or below form)
- **FR-031a**: Cancel shows confirmation: "Discard changes and exit?"
- **FR-031b**: On confirm, redirect to home page (no data saved)
- **FR-032**: System MUST validate all required fields before enabling Next/Create button
- **FR-032a**: Show inline validation errors on blur for each field
- **FR-032b**: Show full validation summary on Next/Create button click if errors exist

#### Versus Creation & Database

- **FR-033**: Creation process MUST be atomic (all-or-nothing) using try-catch with manual rollback
- **FR-034**: System MUST create Versus record with: name, type, reverse_ranking flag, created_by (creator's player_id)
- **FR-035**: System MUST create versus_players records for all invited players with:
  - player_id (validated email from players table)
  - is_commissioner flag
  - nickname (if provided, else NULL to use display_name)
- **FR-036**: System MUST create objectives records for all defined objectives with:
  - title, points (positive or negative integer), description
- **FR-037**: If ANY database operation fails, system MUST rollback all created records
- **FR-037a**: Show error: "Failed to create Versus. Please try again."
- **FR-037b**: Provide "Retry" button that re-attempts creation with same data
- **FR-037c**: Log detailed error for debugging
- **FR-038**: On successful creation, system MUST redirect to new Versus detail page (`/versus/[id]`)
- **FR-039**: System MUST show success toast notification: "Versus '[name]' created successfully!"

#### Home Page Commissioner Menu

- **FR-040**: Home page Versus list MUST show three-dot menu icon for each Versus where current user is a commissioner
- **FR-041**: Non-commissioners MUST NOT see three-dot menu on Versus they don't commission
- **FR-042**: Three-dot menu MUST have three options:
  - "View Settings" → navigates to `/versus/[id]/settings`
  - "Manage Players" → navigates to `/versus/[id]/players`
  - "Manage Objectives" → navigates to `/versus/[id]/objectives`

#### Dual-Purpose Pages (Creation + Editing)

- **FR-043**: Step 1 UI (`/create`) MUST be reusable as "Edit Settings" page (`/versus/[id]/settings`)
- **FR-044**: Step 2 UI (`/create/players`) MUST be reusable as "Edit Players" page (`/versus/[id]/players`)
- **FR-045**: Step 3 UI (`/create/objectives`) MUST be reusable as "Edit Objectives" page (`/versus/[id]/objectives`)
- **FR-046**: Edit mode MUST load existing data from database
- **FR-047**: Edit mode MUST validate commissioner permissions before allowing page access
- **FR-047a**: Non-commissioners attempting to access edit pages MUST see error: "Only commissioners can edit this Versus"
- **FR-048**: Edit mode MUST use "Save Changes" button instead of "Create Versus" button
- **FR-049**: Edit mode MUST show "Cancel" button that returns to `/versus/[id]` (no changes saved)

### Key Entities

- **Versus**: Represents a game/challenge with name, type, reverse_ranking flag, commissioner references
- **Versus Players**: Join table linking players to a specific Versus with is_commissioner flag
- **Objectives**: Tasks/rules within a Versus with title, points (positive/negative), explanation
- **Player**: User participating in the Versus (references auth user)

### Database Schema Considerations

The schema already exists (see `docs/database/supabase-schema.sql`). Key tables:
- `versus`: id, name, reverse_ranking, created_by, created_at, updated_at
- `versus_players`: id, versus_id, player_id, is_commissioner
- `objectives`: id, versus_id, title, points, description, created_at, updated_at
- `players`: id, user_id, display_name, email

**New fields required**:
1. **`versus.type`** (VARCHAR(50)) - Store Versus type: 'Scavenger Hunt', 'Fitness Challenge', 'Chore Competition', 'Swear Jar', 'Other'
2. **`versus_players.nickname`** (VARCHAR(50), nullable) - Store Versus-specific nickname override. If NULL, use `players.display_name`

**Schema changes needed**:
```sql
-- Add type column to versus table
ALTER TABLE versus ADD COLUMN type VARCHAR(50);

-- Add nickname column to versus_players table  
ALTER TABLE versus_players ADD COLUMN nickname VARCHAR(50);
```

## Success Criteria

### Measurable Outcomes

- **SC-001**: User can complete entire wizard (all 3 steps) in under 3 minutes for a simple Versus
- **SC-002**: 90% of first-time users successfully create their first Versus without errors
- **SC-003**: Reverse Ranking checkbox appears/disappears correctly based on Type selection without page refresh
- **SC-004**: AI-suggested objectives endpoint returns within 500ms (even when mocked)
- **SC-005**: Validation errors are clear and actionable ("Email already invited" not "Validation error")
- **SC-006**: User can navigate backward through wizard without losing entered data
- **SC-007**: Created Versus immediately appears on home page after creation
- **SC-008**: All invited players receive database records and can access the Versus

## Technical Notes

### Form State Management
- Use React state or form library (React Hook Form recommended) to manage wizard state
- Persist data across steps in component state or context
- Validate on each step before allowing Next button

### Routing Strategy
**Decision**: Use separate routes for better reusability as edit pages.

**Wizard routes**:
- Step 1: `/create` (Settings)
- Step 2: `/create/players` (Set Players)
- Step 3: `/create/objectives` (Set Objectives)

**Edit routes** (same UI components, different mode):
- Settings: `/versus/[id]/settings`
- Players: `/versus/[id]/players`
- Objectives: `/versus/[id]/objectives`

This enables clean URL structure and component reuse across creation and editing workflows.

### Conditional UI Logic
```typescript
// Reverse Ranking visibility logic
const showReverseRanking = type === "Swear Jar" || type === "Other";
const defaultReverseRanking = type === "Swear Jar";
```

### Mock AI Endpoint
Create server action `app/actions/suggestions.ts`:
```typescript
export async function generateObjectiveSuggestions(count: number) {
  // For now, always return these 4 regardless of count
  return [
    { title: "Run 5 miles", points: 10, isPositive: true },
    { title: "Do 20 pushups", points: 5, isPositive: true },
    { title: "Attend yoga class", points: 8, isPositive: true },
    { title: "Bike 15 miles", points: 15, isPositive: true },
  ];
}
```

### Reusability Pattern
Each step component should accept `mode` prop:
- `mode="create"` - Wizard step behavior (Next/Back buttons)
- `mode="edit"` - Standalone page behavior (Save/Cancel buttons)

## Implementation Considerations

### File Structure (per Constitution: prefer consolidation)
```
app/
  page.tsx                        # Home page - ADD commissioner three-dot menu
  create/
    page.tsx                      # Step 1: Settings
    players/
      page.tsx                    # Step 2: Set Players
    objectives/
      page.tsx                    # Step 3: Set Objectives
  versus/
    [id]/
      settings/
        page.tsx                  # Edit Settings (reuses Step 1 component)
      players/
        page.tsx                  # Edit Players (reuses Step 2 component)
      objectives/
        page.tsx                  # Edit Objectives (reuses Step 3 component)
app/actions/
  versus.ts                       # ADD: createVersusWithPlayersAndObjectives()
  suggestions.ts                  # NEW FILE: generateObjectiveSuggestions()
components/
  versus-wizard-step1.tsx         # Settings form component (mode: create | edit)
  versus-wizard-step2.tsx         # Players form component (mode: create | edit)
  versus-wizard-step3.tsx         # Objectives form component (mode: create | edit)
  versus-card.tsx                 # UPDATE: Add commissioner menu (three dots)
```

**Note**: Could consolidate all three wizard step components into one file per constitution, but separate files may be clearer given dual-purpose nature. Use judgment.

### Form Validation
- Email validation: Use regex or library (email-validator)
- Duplicate detection: Check emails in state before API call
- Required fields: Show inline errors on blur and on submit attempt
- Success feedback: Toast notification + redirect

### Database Transaction
The creation process should be atomic (all-or-nothing):
1. Create versus record
2. Create versus_players records (including creator as commissioner)
3. Create objectives records
4. If any fail, rollback all

Use Supabase transaction or handle errors carefully.

## Resolved Questions

All clarifications have been addressed and incorporated into the specification above. Key decisions:

1. ✅ **Player invitations**: Existing accounts only (email validation against players table). Future: email invites.
2. ✅ **Creator inclusion**: Auto-included as Player #1, counts toward max players.
3. ✅ **Display names**: Use from database with optional Versus-specific nickname override.
4. ✅ **Commissioner menu**: Three-dot menu on home page Versus list (commissioners only).
5. ✅ **Routing**: Separate routes (`/create`, `/create/players`, `/create/objectives`).
6. ✅ **Objective points**: +/- dropdown multiplies points value before storing.
7. ✅ **AI suggestions**: Always returns 4 objectives, no count selector (MVP).
8. ✅ **Navigation**: Back/Next buttons, Cancel with confirmation, validation on blur + submit.

## Open Questions for Future Features

1. Should we send email invitations to non-users when they're invited? (Phase 2)
2. What happens to existing completions if objective points change? (Recalculate scores automatically - document in edit page)
3. Should we add objective categories/tags? (Not in MVP - keep simple)
4. Real AI integration for objective suggestions based on Versus type? (Phase 2)

## Future Enhancements

- Real AI integration for objective suggestions based on Versus type
- Drag-and-drop objective reordering
- Objective templates library
- Bulk player import via CSV
- Email invitations for non-users
- Player role management (viewer, participant, commissioner)
- Versus templates (clone previous Versus)
- Objective categories/tags

---

## Summary

### Requirements Count
- **User Stories**: 5 (P1: 1, P2: 1, P3: 1, P4: 2)
- **Functional Requirements**: 49 (FR-001 through FR-049)
- **Success Criteria**: 8
- **Edge Cases**: 12 documented and resolved
- **Database Changes**: 2 new columns

### Key Features
✅ Multi-step wizard with separate routes  
✅ Dual-purpose components (create + edit modes)  
✅ Commissioner menu on home page  
✅ Email validation against existing players  
✅ Versus-specific nickname overrides  
✅ Conditional reverse ranking  
✅ AI-suggested objectives (mocked for MVP)  
✅ Comprehensive validation and error handling  
✅ Atomic database transactions with rollback  

### Files to Modify
- `app/page.tsx` - Add commissioner menu
- `components/versus-card.tsx` - Add three-dot menu UI
- `app/actions/versus.ts` - Add creation function
- `docs/database/supabase-schema.sql` - Add type and nickname columns

### Files to Create
- `app/create/page.tsx` - Step 1: Settings
- `app/create/players/page.tsx` - Step 2: Players
- `app/create/objectives/page.tsx` - Step 3: Objectives
- `app/versus/[id]/settings/page.tsx` - Edit Settings
- `app/versus/[id]/players/page.tsx` - Edit Players
- `app/versus/[id]/objectives/page.tsx` - Edit Objectives
- `app/actions/suggestions.ts` - Mock AI endpoint
- `components/versus-wizard-step1.tsx` - Settings component
- `components/versus-wizard-step2.tsx` - Players component
- `components/versus-wizard-step3.tsx` - Objectives component

**Ready for implementation!** 🚀

