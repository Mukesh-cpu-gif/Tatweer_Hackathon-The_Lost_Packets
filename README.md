# Aounak - Rural Emergency Response for Al Qua'a

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-orange?logo=firebase)](https://firebase.google.com/)
[![PWA](https://img.shields.io/badge/PWA-offline%20aware-5A0FC8)](public/manifest.json)
[![Tatweer](https://img.shields.io/badge/Tatweer%20Hackathon-2026-0f766e)](docs/EVIDENCE.md)

Aounak is a mobile-first emergency response PWA for rural and desert communities. It helps a resident send a precise SOS request with emergency type, GPS location, and optional details, then helps nearby qualified responders understand and reach the incident faster.

**Challenge:** Tatweer Hackathon 2026 - Challenge 2: Reaching people quickly across a dispersed community.

**Core mission:** Shorten the coordination gap between an urgent need and the arrival of the right nearby help.

## 🔗 Project Links

🌐 **Live Demo:** https://aounak.vercel.app

🎥 **Demo Video:** https://youtu.be/eKDrTjFcbs8

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

| Feature                           | What it does                                                                     | Why it matters                                                          |
| --------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Visual SOS flow                   | Lets users choose a relevant emergency type quickly                              | Reduces typing during stress                                            |
| GPS location capture              | Attaches coordinates to SOS requests                                             | Makes desert/farm locations easier to find                              |
| Live incident summary             | Creates an incident record with status, skills, and responder counts             | Gives responders a shared source of truth                               |
| Optional request blocks           | Adds contact, crisis, medical, livestock, fuel, or vehicle details after the SOS | Lets responders receive more detail without delaying the first alert    |
| Responder dashboard               | Shows active community requests and accept actions                               | Helps volunteers see who needs help                                     |
| Skill-aware matching              | Uses helper skills and distance calculations where profiles are available        | Sends the right type of help, not just anyone                           |
| Offline SMS fallback              | Opens an SMS with emergency details and a map link                               | Useful when data is weak but SMS may work                               |
| IndexedDB queue                   | Stores offline SOS attempts for later sync                                       | Gives weak-connectivity flows a recovery path                           |
| PWA support                       | Includes manifest, app icons, shortcuts, splash art, and service worker caching  | Makes the web app feel closer to a mobile tool                          |
| History                           | Shows created/helped activity for signed-in or local sessions                    | Supports accountability and review                                      |
| Profile readiness                 | Tracks contact, vehicle, skills, availability, medical notes, and GPS            | Helps responders be more useful and trustworthy                         |
| English/Arabic UI                 | Provides app-wide language switching and RTL direction                           | Fits local community use better than English-only UX                    |
| On-device animal/threat assistant | Prototype TensorFlow image/symptom assistant for venomous-threat details         | Adds richer context for responders without relying on a cloud AI call   |
| Route comparison prototype        | Shows a Leaflet-based paved/off-road route comparison for an incident            | Demonstrates how local route knowledge could improve dispatch decisions |

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

## Tech Stack

- **App:** Next.js App Router, React, TypeScript
- **UI:** Tailwind CSS, shadcn/ui-style primitives, lucide-react icons
- **Auth:** Firebase Authentication
- **Data:** Firestore with localStorage fallbacks for demo/degraded paths
- **Offline:** PWA manifest, service worker app shell caching, IndexedDB SOS queue, SMS deep link fallback
- **Maps:** Leaflet and React Leaflet
- **AI prototype:** TensorFlow.js with local model assets in `public/model`
- **Hosting target:** Vercel or Firebase Hosting

## Run Locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open the local Next.js URL printed by the terminal.

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

## More Docs

- [Evidence and Validation](docs/EVIDENCE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Feasibility](docs/FEASIBILITY.md)
- [Limitations](docs/LIMITATIONS.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Security](docs/SECURITY.md)
