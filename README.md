# Aounak - Rural Emergency Response for Al Qua'a

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-orange?logo=firebase)](https://firebase.google.com/)
[![PWA](https://img.shields.io/badge/PWA-offline%20aware-5A0FC8)](public/manifest.json)
[![Tatweer](https://img.shields.io/badge/Tatweer%20Hackathon-2026-0f766e)](docs/EVIDENCE.md)

Aounak is a mobile-first emergency response PWA for rural and desert communities. It helps a resident send a precise SOS request with emergency type, GPS location, and optional details, then helps nearby qualified responders understand and reach the incident faster.

**Challenge:** Tatweer Hackathon 2026 - Challenge 2: Reaching people quickly across a dispersed community.

**Core mission:** Shorten the coordination gap between an urgent need and the arrival of the right nearby help.

> Live demo: _Add deployment URL before final submission_
>
> Demo video: _Add video URL before final submission_
>
> Team: The Lost Packets

## Problem

Al Qua'a is a rural and dispersed community near Al Ain. In urgent situations, residents, farm workers, and visitors may be far from formal help, and desert or farm locations can be difficult to explain over a phone call. Weak mobile data makes the first few minutes even harder.

The right helper matters too. A medical emergency, vehicle stuck in sand, fuel shortage, water pump failure, livestock issue, or venomous bite may each need different skills: first aid, 4x4 driving, winch recovery, fuel delivery, livestock experience, or navigation.

## Target Users

- Residents, farm workers, and visitors who need urgent help.
- Local volunteers and responders with useful skills, vehicles, and local knowledge.
- Community organizers or dispatchers in a future deployment.

## Solution

Aounak turns a stressful request into a structured emergency signal:

- A requester chooses a visual SOS type.
- The app captures GPS coordinates, with an Al Qua'a fallback when location is unavailable.
- A live incident summary is stored in Firestore when configured, with local fallback behavior for demo/offline cases.
- Optional request details can be added after the first SOS is sent.
- Responders can see active requests, required skills, requester details, and route/map context.
- An offline SMS path prepares a message with location details when mobile data is weak.

## Core Features

| Feature | What it does | Why it matters |
|---|---|---|
| Visual SOS flow | Lets users choose a relevant emergency type quickly | Reduces typing during stress |
| GPS location capture | Attaches coordinates to SOS requests | Makes desert/farm locations easier to find |
| Live incident summary | Creates an incident record with status, skills, and responder counts | Gives responders a shared source of truth |
| Optional request blocks | Adds contact, crisis, medical, livestock, fuel, or vehicle details after the SOS | Lets responders receive more detail without delaying the first alert |
| Responder dashboard | Shows active community requests and accept actions | Helps volunteers see who needs help |
| Skill-aware matching | Uses helper skills and distance calculations where profiles are available | Sends the right type of help, not just anyone |
| Offline SMS fallback | Opens an SMS with emergency details and a map link | Useful when data is weak but SMS may work |
| IndexedDB queue | Stores offline SOS attempts for later sync | Gives weak-connectivity flows a recovery path |
| PWA support | Includes manifest, app icons, shortcuts, splash art, and service worker caching | Makes the web app feel closer to a mobile tool |
| History | Shows created/helped activity for signed-in or local sessions | Supports accountability and review |
| Profile readiness | Tracks contact, vehicle, skills, availability, medical notes, and GPS | Helps responders be more useful and trustworthy |
| English/Arabic UI | Provides app-wide language switching and RTL direction | Fits local community use better than English-only UX |
| On-device animal/threat assistant | Prototype TensorFlow image/symptom assistant for venomous-threat details | Adds richer context for responders without relying on a cloud AI call |
| Route comparison prototype | Shows a Leaflet-based paved/off-road route comparison for an incident | Demonstrates how local route knowledge could improve dispatch decisions |

## Demo Flow

1. Open the app and choose **Send SOS Now**.
2. Select an emergency type, such as **Vehicle Stuck** or **Medical Assist**.
3. Review captured coordinates or fallback Al Qua'a coordinates.
4. Send a live digital SOS.
5. Add optional request details, such as contact, crisis notes, vehicle details, or first-aid context.
6. Open the responder dashboard to view active incidents and required skills.
7. Accept an incident and open the map route prototype.
8. Show the offline SMS fallback as the low-data backup path.
9. Open profile/history to show readiness and activity tracking.

## Screenshots

Screenshot placeholders are tracked in [docs/EVIDENCE.md](docs/EVIDENCE.md). Before final submission, add fresh mobile screenshots to `docs/screenshots/` after the deployed app and Firebase demo accounts are ready.

Current recommended screenshot set:

| Screen | Target file |
|---|---|
| Welcome | `docs/screenshots/01-welcome.png` |
| SOS selection | `docs/screenshots/04-sos-selection.png` |
| SOS report | `docs/screenshots/05-sos-report-vehicle.png` |
| Home dashboard | `docs/screenshots/06-home-dashboard.png` |
| Profile readiness | `docs/screenshots/07-profile-readiness.png` |
| Responder map | `docs/screenshots/09-map-route-prototype.png` |

## Judging Criteria Mapping

| Tatweer criterion | How Aounak addresses it | Evidence |
|---|---|---|
| Impact | Targets urgent help in rural/desert settings where distance and unclear location delay response | Demo flow, screenshots, problem section |
| Relevance | Directly addresses Challenge 2 by connecting residents with nearby appropriate help | Challenge section, SOS and responder flows |
| Feasibility | Uses common web/PWA/Firebase infrastructure and smartphone APIs | [Architecture](docs/ARCHITECTURE.md), [Feasibility](docs/FEASIBILITY.md) |
| Readiness | Working MVP paths for SOS, profile, incident feed, responder view, map/history/fallback where accessible | [Evidence](docs/EVIDENCE.md), [Testing](docs/TESTING.md) |
| Scalability | Skill tags, reusable data model, configurable emergency categories, and Firebase-backed sync can extend to other communities | Scalability section, architecture docs |
| Evidence | Specific claims are linked to screenshots, commands, or manual test steps | [Evidence](docs/EVIDENCE.md) |
| Documentation | Setup, env, architecture, testing, limitations, deployment, and demo script are included | `README.md` plus `docs/` |

## Tech Stack

- **App:** Next.js App Router, React, TypeScript
- **UI:** Tailwind CSS, shadcn/ui-style primitives, lucide-react icons
- **Auth:** Firebase Authentication
- **Data:** Firestore with localStorage fallbacks for demo/degraded paths
- **Offline:** PWA manifest, service worker app shell caching, IndexedDB SOS queue, SMS deep link fallback
- **Maps:** Leaflet and React Leaflet
- **AI prototype:** TensorFlow.js with local model assets in `public/model`
- **Hosting target:** Vercel or Firebase Hosting

## Architecture Summary

Aounak is a client-heavy PWA with Firebase-backed sync where environment variables are configured. Guest emergency creation is intentionally supported for minimal SOS summaries, while private profile data is protected by Firestore rules.

Key routes:

- `/` welcome and entry actions
- `/login` and `/register` authentication
- `/home` requester dashboard and recent activity
- `/sos` emergency type selection
- `/sos/report` live SOS, optional details, offline SMS, and first-aid guidance
- `/profile` contact, vehicle, skills, availability, medical notes, and GPS readiness
- `/history` created/helped incident activity
- `/responder` responder profile and active incident feed
- `/responder/map` route comparison prototype

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the system diagram and data model notes.

## Run Locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open the local Next.js URL printed by the terminal.

## Environment Variables

`.env.local` is intentionally ignored and must not be committed. The app expects Firebase web config variables:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Firebase client config is not a backend password. Protect app data through Firebase Authentication plus Firestore security rules. Never commit Firebase Admin SDK service accounts, private keys, or real personal emergency data.

## Command Checks

```bash
npm run lint
npm run typecheck
npm run build
```

See [docs/TESTING.md](docs/TESTING.md) for the latest recorded results.

## Deployment

The intended deployment target is Vercel or Firebase Hosting. Add the `NEXT_PUBLIC_FIREBASE_*` variables in the hosting provider, deploy the app, then add the deployed domain to Firebase Authentication authorized domains.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Feasibility

Aounak is feasible as an MVP because it uses standard smartphone and web capabilities: browser location, Firebase Authentication, Firestore, PWA assets, local storage/IndexedDB fallback, and SMS deep links. No special hardware is required for the demo path.

Real deployment would require verified responders, local governance, privacy policy review, emergency-service coordination, and field testing in Al Qua'a or a similar community.

## Scalability

The current structure can scale by:

- Adding more communities and emergency categories.
- Verifying responder skills and availability.
- Adding an admin/dispatcher dashboard.
- Improving offline sync after signal returns.
- Integrating official escalation paths.
- Localizing for more languages used by residents and farm workers.

## Known Limitations

- This is a hackathon MVP, not a certified emergency dispatch system.
- Route comparison uses prototype/demo route metrics, not a validated routing engine.
- SMS fallback depends on the user's phone, SMS app, and mobile network.
- Browser GPS accuracy depends on permissions, hardware, and signal.
- Responder identity and skills need verification before real use.
- The animal/threat assistant is assistive only and not medical authority.
- Offline behavior needs production HTTPS and real-device field testing.

## Team

**The Lost Packets** - Tatweer Hackathon 2026.

## More Docs

- [Evidence and Validation](docs/EVIDENCE.md)
- [Testing](docs/TESTING.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Feasibility](docs/FEASIBILITY.md)
- [Limitations](docs/LIMITATIONS.md)
- [Demo Script](docs/DEMO_SCRIPT.md)
- [Submission Checklist](docs/SUBMISSION_CHECKLIST.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Security](docs/SECURITY.md)
- [UI Polish Notes](docs/UI_POLISH.md)
