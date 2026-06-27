# Aounak Premium UI Upgrade Plan

## Summary
Aounak already has a strong dark emergency-rescue visual direction, but the next design pass should make it feel like a polished desert-response command system: calmer, glassier, more spatial, more consistent, and more operational.

This plan is intentionally design-focused. It does not change the product flow from `Newflow.md`; it upgrades the look, feel, component consistency, motion, and information hierarchy around that flow.

## Design North Star
Build Aounak as a **premium emergency command interface for desert community response**.

The UI should feel:
- High-trust and calm during emergency use.
- Glassy, modern, and spatial without becoming decorative noise.
- Operational and field-ready, not like a marketing landing page.
- Mobile-first, with dense but readable controls.
- Clear about live state: profile readiness, GPS, SOS status, responder matching, and request history.

## Core Visual Principles

### 1. One Coherent Design System
Create consistent rules for repeated UI decisions:
- Spacing scale: `4, 8, 12, 16, 24, 32`.
- Radius scale: buttons `12px`, cards/panels `16px`, dialogs/sheets `20px`.
- Border style: mostly `border-white/10` or `border-zinc-800/60`; colored borders only for status.
- Shadow style: soft depth by default; glow only for emergency, availability, or live-state moments.
- Typography hierarchy: compact operational headings, readable body copy, small uppercase labels.

### 2. Better Glassmorphism
Use glass as a controlled surface system, not decoration everywhere:
- Dark translucent panels: `bg-zinc-950/45`.
- Subtle blur: `backdrop-blur-xl`.
- Thin highlight borders: `border-white/10`.
- Low-opacity status glows only behind important modules.
- Avoid stacking too many bright glowing cards at the same time.

### 3. Depth Through Layers
Every major screen should have three layers:
- Base layer: dark desert/night command background.
- Ambient layer: subtle terrain/map/topographic texture or radial lighting.
- UI layer: glass panels, command tiles, live cards, dialogs.

For Aounak, a dark map/topographic or desert-terrain texture would likely feel more premium than generic dark gradients.

### 4. Strict Color Discipline
Use color semantically:
- Neutral/zinc: default UI.
- Indigo/cyan: system intelligence, navigation, matching, GPS.
- Rose: active emergency only.
- Amber: warning/fallback/degraded state.
- Emerald: available/success/en-route.
- Gray: inactive/offline/complete but unavailable.

Avoid making every card colorful. The app should feel calm until something needs attention.

### 5. Operational Copy
Premium emergency UI sounds precise:
- Use “Live request active” instead of vague “SOS Active”.
- Use “Available” instead of “Ready”.
- Use “No active community requests” instead of “No recent incidents recorded”.
- Use “Firestore unavailable. Local fallback active.” instead of generic technical errors.

Copy should be short, calm, and useful.

## shadcn/ui Strategy
The app already uses shadcn primitives, but only a small set is installed:
- `badge`
- `button`
- `card`
- `input`
- `separator`

The next premium pass should lean more heavily on shadcn as the structure layer, then style those primitives with Aounak-specific glass classes.

Recommended additions:
- `dialog`: incident details, helper match details, confirmation moments.
- `sheet`: mobile incident details, profile setup, bottom-drawer emergency panels.
- `accordion`: optional SOS request blocks after sending.
- `alert`: GPS fallback, Firestore fallback, SOS sent, offline SMS queued.
- `sonner`: toast feedback for save/send/update actions.
- `skeleton`: loading states instead of plain spinners.
- `progress`: profile completion and SOS dispatch timeline.
- `switch`: availability toggle.
- `tooltip`: icon-only buttons like profile, language, copy, close.
- `tabs`: history filters and profile sections.
- `command`: optional future action palette/search for incidents/helpers.

Suggested install command when implementing:

```bash
npx shadcn@latest add dialog sheet accordion alert sonner skeleton progress switch tooltip tabs command
```

## Shared Component Plan
Create local Aounak wrappers around shadcn primitives so the style is reusable instead of repeated with long Tailwind strings.

### `GlassPanel`
Reusable glass surface for major modules.
- Props: `tone`, `interactive`, `className`.
- Base style: translucent dark background, thin border, blur, controlled shadow.

### `StatusPill`
Reusable state label.
- Tones: `neutral`, `live`, `warning`, `success`, `danger`, `offline`.
- Used for GPS, profile state, incident state, network state.

### `EmergencyCommandTile`
Reusable emergency category button.
- Fixed size and stable layout.
- Icon, label, optional short description.
- Color only from emergency type style.

### `IncidentCard`
Reusable incident/activity card.
- Type icon, status, requester, time, responder counts.
- Click opens `IncidentDialog` or mobile `Sheet`.

### `IncidentDialog`
Use shadcn `Dialog`.
- Summary, location, required skills, detail blocks, responder state.
- No self-accept action for requester.

### `RequestBlock`
Use shadcn `Accordion` or a styled card wrapper.
- Draft mode with “Add to request”.
- Frozen mode after save with clean summary rows and “Edit”.

### `EmergencyActionBar`
Sticky/high-priority action area on `/sos/report`.
- Live SOS button.
- Offline SMS button.
- Live request status after send.

### `ProfileCompletionCard`
Uses shadcn `Progress`.
- Shows readiness percentage.
- Missing fields: contact, vehicle, skills, availability, location.

## Page-by-Page Upgrade Plan

### `/` Welcome
Goal: premium, simple entry point.
- Keep the first screen action-focused: Log In, Register, Send SOS Now.
- Replace generic gradient-only backdrop with subtle dark terrain/map texture.
- Use one hero-scale brand block, not bilingual text in English mode.
- Use glass command cards with restrained borders.
- Add very subtle background depth only, no noisy decoration.

### `/home`
Goal: rescue command dashboard.
- Add compact top status strip:
  - Profile readiness.
  - Availability.
  - Network/Firestore state if known.
  - GPS/location readiness if available.
- Keep emergency SOS grid as the primary “need help” area.
- Upgrade emergency tiles into fixed-format command tiles.
- Make Recent Activity denser and more operational.
- Use `Dialog` or `Sheet` for incident details.
- Use `Skeleton` while profile/incidents are loading.
- Helper match popup should feel like a dispatch prompt, not an ad-style card.

### `/sos`
Goal: fast emergency type selection.
- Reduce decorative text and keep choice speed high.
- Use large command tiles with clear icon and label.
- Keep back and language controls icon-first.
- Avoid secondary language labels.
- Add optional “Last known location ready” status if available later.

### `/sos/report`
Goal: live emergency request console.
- Top section should feel like telemetry:
  - Emergency type.
  - Coordinates.
  - GPS status.
  - Live request state.
- Move `Send Live Digital SOS` and `Send Offline SMS` into an `EmergencyActionBar`.
- After live send, show a dispatch timeline:
  - Created.
  - Responders notified.
  - Details updating.
  - En route.
- Convert optional blocks into `Accordion` sections.
- Saved block summaries should be clean key/value rows.
- Use `Alert` for “send first before adding details”.
- Use `Toast` for successful block updates.

### `/profile`
Goal: profile readiness and helper identity.
- Use `Progress` for completion.
- Use `Switch` for availability.
- Split form into tabs or clear sections:
  - Contact.
  - Vehicle.
  - Skills.
  - Medical.
  - Location.
- Add clear missing-field states instead of only a red dot on home.
- Keep private/sensitive medical details visually separated.

### `/history`
Goal: calm personal activity ledger.
- Use stat cards with consistent sizing.
- Add tabs/filters:
  - Created.
  - Helped.
  - Pending.
  - Resolved.
- Use the same `IncidentCard` component as home.
- Show guest/local history clearly if user is not signed in or data is local-only.

## Motion Plan
Use motion to communicate state, not to decorate:
- Buttons press down slightly on active.
- Cards lift by only `1-2px`.
- Dialogs fade/scale in.
- Sheets slide from bottom on mobile.
- Status dots pulse slowly only for live/pending states.
- Skeletons replace spinners where data is loading.
- Avoid constant animation in large areas.

Possible implementation approach:
- Use Tailwind transitions first.
- Add `tailwindcss-animate` patterns already supported by shadcn.
- Only introduce Framer Motion if the app needs more complex sequences later.

## Layout And Responsiveness
Mobile is primary.
- Bottom navigation must never overlap core actions.
- SOS action buttons should remain easy to reach.
- Cards and command tiles need stable dimensions.
- Text should not wrap awkwardly inside buttons.
- Dialogs should become sheets or full-width panels on small screens.

Desktop should feel like a centered command console:
- Max width around `640-760px` for current mobile-first layout.
- Wider future view can add side panels for map/activity if needed.

## Accessibility And Trust
- Every icon-only button needs a tooltip and `aria-label`.
- Status cannot rely on color alone; labels must explain state.
- Emergency buttons need strong focus states.
- Text contrast must stay high on glass surfaces.
- Arabic mode needs RTL direction and no mixed-language labels.
- English mode must show no Arabic unless the content itself is user-provided.

## Implementation Phases

### Phase 1 - Design Tokens And Shared Surfaces
- Audit repeated Tailwind card/button/panel classes.
- Create `GlassPanel`, `StatusPill`, `EmergencyCommandTile`.
- Standardize radius, border, blur, and shadow values.
- Keep behavior unchanged.

### Phase 2 - shadcn Infrastructure
- Add needed shadcn components:
  - `dialog`
  - `sheet`
  - `accordion`
  - `alert`
  - `sonner`
  - `skeleton`
  - `progress`
  - `switch`
  - `tooltip`
  - `tabs`
- Add `Toaster` in app layout if using `sonner`.
- Replace ad hoc modals with `Dialog`/`Sheet`.

### Phase 3 - Home And Incident UX
- Redesign `/home` status strip.
- Upgrade emergency grid tiles.
- Replace custom incident overlay with `IncidentDialog`.
- Polish helper match popup.
- Ensure self-created incidents cannot show accept actions.

### Phase 4 - SOS Report Console
- Introduce `EmergencyActionBar`.
- Add live dispatch timeline.
- Convert optional detail blocks to accordion-style modules.
- Add toasts/alerts for request updates.
- Improve GPS/fallback messaging.

### Phase 5 - Profile And History Polish
- Add profile completion progress.
- Replace availability toggle with shadcn `Switch`.
- Add history tabs and refined stat cards.
- Share `IncidentCard` between home/history.

### Phase 6 - Visual QA And Cleanup
- Check English and Arabic modes.
- Check mobile widths.
- Check text wrapping in buttons/cards.
- Run screenshots for `/`, `/home`, `/sos`, `/sos/report`, `/profile`, `/history`.
- Run `npm run lint`, `npx tsc --noEmit`, and `npm run build`.

## Acceptance Checklist
- English mode has no Arabic UI text except user-provided content.
- Arabic mode has no English UI text except brand/product names where intentional.
- Profile status is visually clear and not misleading.
- Users cannot accept their own requests.
- Every modal/dialog/sheet has accessible close behavior.
- SOS can be sent quickly without profile setup.
- Optional request details remain editable after live send.
- Home feels like a command dashboard, not a marketing page.
- Request report feels like a live emergency console.
- UI components share consistent spacing, radius, borders, and status colors.

## Recommended First Implementation Slice
Start with a small but high-impact slice:
1. Add shadcn `dialog`, `sheet`, `alert`, `skeleton`, `progress`, `switch`, and `tooltip`.
2. Create `GlassPanel` and `StatusPill`.
3. Replace the custom incident detail overlay on `/home` with `Dialog`.
4. Replace the profile availability toggle with `Switch`.
5. Add profile completion progress.

This gives the app an immediate premium lift without risking the SOS flow.
