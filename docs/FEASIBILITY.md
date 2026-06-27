# Feasibility

Aounak is feasible as a hackathon MVP because it uses common, low-cost web and mobile infrastructure.

| Need | MVP approach |
|---|---|
| Mobile access | Browser-based PWA |
| User accounts | Firebase Authentication |
| Incident storage | Firestore |
| Location | Browser geolocation with fallback coordinates |
| Weak data fallback | SMS deep link and IndexedDB queue |
| Deployment | Vercel or Firebase Hosting |
| Responder matching | Local volunteer/helper profiles with skills, availability, and distance |
| Map view | Leaflet route prototype |

## Why This Can Work In A Rural Setting

- Residents and responders only need smartphones.
- No special hardware is required for the MVP flow.
- The app can be deployed through standard web hosting.
- SMS fallback supports low-connectivity moments when mobile data is weak.
- Skill tags make the response more relevant than a generic broadcast.
- GPS coordinates reduce the burden of explaining farm/desert locations verbally.

## Operational Requirements For Real Deployment

- Verified responder onboarding and skill validation.
- Local admin/dispatcher dashboard.
- Emergency-service escalation and coordination policy.
- Privacy policy for contact, location, and medical-detail handling.
- Field testing in Al Qua'a or similar rural areas.
- Real-device offline/PWA testing on production HTTPS.
- More languages if the deployed community needs them.
