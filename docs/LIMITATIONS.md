# Limitations and Future Work

## Current MVP Limitations

- The app is a hackathon MVP, not a certified emergency dispatch system.
- Real deployment would require official emergency-service coordination.
- SMS fallback depends on the user's phone, SMS app, and mobile network.
- Browser GPS accuracy depends on user permissions, device quality, and signal.
- Responder identity, availability, and skills need verification before real use.
- Route comparison uses prototype/demo route data and is not a validated navigation engine.
- Offline behavior must be tested on production HTTPS and real mobile devices.
- The AI/animal identification feature should be treated as assistive only, not medically authoritative.
- Firestore sync requires a configured Firebase project and deployed security rules.

## Future Work

- Verified responder onboarding.
- Admin/dispatcher dashboard.
- Real-time responder location sharing.
- Emergency-service escalation workflow.
- More languages for residents, visitors, and farm workers.
- Better offline sync after signal returns.
- Incident resolution/cancellation workflows.
- Field testing with local community members.
- Validated routing data for desert/farm paths.
