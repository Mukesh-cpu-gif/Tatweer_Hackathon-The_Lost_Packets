# Evidence and Validation

This document keeps Aounak's hackathon claims falsifiable. Statuses should be read literally: verified items were checked in this repo or local app session; prototype items are demonstrable but not production-validated; pending items need final deployment, accounts, or field testing.

## Evidence Summary

| Claim | Evidence | Status |
|---|---|---|
| A user can open the public emergency flow without registration | `/` and `/sos` screenshots or manual demo | Verified in local browser |
| A user can prepare an SOS report with emergency type and coordinates | `/sos/report?type=vehicle_stuck` screenshot and code path | Verified in local browser |
| GPS fallback uses Al Qua'a demo coordinates when browser location is unavailable | `src/app/sos/report/SOSClient.tsx` fallback path | Prototype |
| A live SOS summary can be created in Firestore or local fallback | `createIncidentSummary` in `src/lib/db.ts` | Prototype |
| Optional incident details can be added after the initial SOS | Incident block writes in `src/lib/db.ts` and SOS report UI | Prototype |
| Offline SMS fallback prepares a location-aware message | `generateSmsDeepLink` in `src/lib/sms.ts` | Prototype |
| Offline SOS attempts can be queued for later sync | IndexedDB queue in `src/lib/storage.ts` | Prototype |
| Responders can view and accept active incidents when authenticated | `/responder` page and `acceptIncident` | Prototype |
| Profile readiness captures contact, vehicle, skills, availability, medical notes, and GPS | `/profile` code path and `saveCommunityProfile` | Pending authenticated screenshot |
| History shows created/helped activity for the current user/session | `/history` code path and incident filtering logic | Pending authenticated screenshot |
| PWA support is present | `public/manifest.json`, app icons, `public/sw.js` | Verified by inspection |
| English/Arabic switching and RTL support are implemented | `LanguageProvider` and translation table | Verified by inspection |
| On-device animal/threat assistant is available for venomous threat reports | `OfflineAnimalAI` and `public/model` assets | Prototype |
| Route comparison view exists | `/responder/map`, Leaflet components | Prototype |
| Voice commanded SOS AI with HTML5 Speech Recognition and offline NLP parsing | `voice-ai.ts` and microphone UI | Verified |
| Continuous recording with 3-second silence detection auto-stop | `useSpeechRecognition` hook | Verified |
| Manual text command fallback for offline/blocked browser speech engines | `Keyboard` toggle in `VoiceAssistOverlay` | Verified |
| Classify emergencies involving cats, horses, dogs and other pets/birds under sick livestock | `voice-ai.ts` NLP parser | Verified |
| Notify responders and dispatcher when incident is created using voice commands | `VoiceAssistOverlay` success notification logic | Verified |
| Reusable BodyLocationSelector for Venomous Bites and general Medical Assist | `BodyLocationSelector` and `SOSClient` integration | Verified |
| Hybrid paved-to-offroad routing engine and active hazard reporting | `/responder/map` Leaflet logic | Prototype |
| App lint passes | `npm run lint` | Verified |
| App typecheck passes | `npm run typecheck` | Verified |
| App builds successfully | `npm run build` | Verified |

## Screenshots

| Screen | File | Status |
|---|---|---|
| Welcome | `docs/screenshots/01-welcome.png` | Captured locally; replace with final deployment screenshot if desired |
| Login | `docs/screenshots/02-login.png` | Captured locally |
| Register | `docs/screenshots/03-register.png` | Placeholder/manual capture needed |
| SOS selection | `docs/screenshots/04-sos-selection.png` | Captured locally |
| SOS report | `docs/screenshots/05-sos-report-vehicle.png` | Captured locally |
| Home dashboard | `docs/screenshots/06-home-dashboard.png` | Manual authenticated capture needed |
| Profile readiness | `docs/screenshots/07-profile-readiness.png` | Manual authenticated capture needed |
| History | `docs/screenshots/08-history.png` | Manual authenticated capture needed |
| Route prototype | `docs/screenshots/09-map-route-prototype.png` | Manual capture with existing incident needed |

## Judging Criteria Mapping

| Tatweer criterion | Evidence in repo |
|---|---|
| Impact | README problem statement, target users, and demo flow focus on urgent rural/desert coordination |
| Relevance | Challenge 2 is named and the app flow centers on reaching appropriate nearby help |
| Feasibility | Architecture, Firebase/PWA implementation, and deployment docs describe a buildable MVP |
| Readiness | Command checks, screenshots, and demo script show what can be run and reviewed |
| Scalability | Skill tags, data model, community profiles, and deployment approach can extend beyond one area |
| Evidence | This file links claims to screenshots, code paths, and command checks |
| Documentation | README plus docs cover setup, testing, architecture, feasibility, limitations, deployment, and security |

## Testing

### Command Checks

Run from the repository root:

```bash
npm install
npm run lint
npm run typecheck
npm run build
```

| Command | Result | Notes |
|---|---|---|
| `npm run lint` | Passed | No warnings after hook dependency fixes |
| `npm run typecheck` | Passed | Uses `tsc --noEmit` |
| `npm run build` | Passed | Next.js production build completed successfully |

### Manual End-to-End Test

| Step | Action | Expected result | Status |
|---|---|---|---|
| 1 | Open `/` | Welcome screen loads with SOS, login, register actions | Passed locally |
| 2 | Toggle language | Interface direction/language changes | Pending manual check |
| 3 | Open `/sos` | Emergency type grid appears | Passed locally |
| 4 | Open `/sos/report?type=vehicle_stuck` | Vehicle stuck report opens with coordinates panel | Passed locally |
| 5 | Copy coordinates | Coordinates are copied or browser blocks clipboard gracefully | Pending |
| 6 | Send live digital SOS | Incident summary is created in Firestore or local fallback | Pending |
| 7 | Add optional request details | Details are saved/displayed after live SOS | Pending |
| 8 | Trigger offline SMS fallback | SMS app/deep link opens with map coordinates; do not send a real SMS | Pending |
| 9 | Open `/profile` | Profile readiness form/status is visible when auth or demo mode permits | Pending authenticated manual capture |
| 10 | Open `/home` | Dashboard shows SOS tiles and recent activity state | Pending authenticated manual capture |
| 11 | Open `/history` | Created/helped activity or useful empty state appears | Pending authenticated manual capture |
| 12 | Open `/responder` | Authenticated responder feed appears; unauthenticated users are redirected | Pending |
| 13 | Open `/responder/map?incidentId=<id>` | Route prototype appears for an existing incident | Pending manual capture with real/local incident ID |

### Test Data Rules

- Use only fake names, emails, phone numbers, and incident details.
- Use Al Qua'a fallback/demo coordinates when browser location is blocked.
- Do not send real SMS messages during testing.
- Do not commit `.env.local`, Firebase private keys, screenshots with real data, or generated build folders.

## Evidence Boundaries

- Aounak does not claim to replace official emergency services.
- Route comparison is a hackathon route prototype, not a certified off-road routing engine.
- The AI assistant is assistive context only and not a medical diagnosis.
- Firestore-backed sync requires valid Firebase project configuration.
- Offline/PWA behavior should be retested on production HTTPS and real mobile devices.
