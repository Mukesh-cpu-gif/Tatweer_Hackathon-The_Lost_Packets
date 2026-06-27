# Security

## Public Repo Safety

- `.env.local`, `.env`, and generated environment files must not be committed.
- Firebase Admin SDK service-account files and private keys must never be committed.
- `node_modules/`, `.next/`, `dist/`, and other build outputs are ignored.
- Screenshots must not show real phone numbers, real medical details, or private locations.

## Firebase Data Boundaries

The app separates private and public-safe data:

| Area | Data |
|---|---|
| `profiles/{uid}` | Private profile details readable only by the owner |
| `responderDirectory/{uid}` | Public-safe responder matching fields |
| `incidents/{incidentId}` | Public-safe SOS summary |
| `incidents/{incidentId}/blocks/{blockKey}` | Optional request details readable by signed-in users |

Firestore rules are included in `firestore.rules`. They should be reviewed and deployed before using real users.

## Emergency Safety

Aounak is not a certified emergency dispatch platform. Any real deployment must include:

- Verified responders.
- Emergency-service escalation policies.
- Privacy and data retention policies.
- Medical-detail handling rules.
- Field testing and local authority/community approval.

## Reporting Issues

For this hackathon repository, create a GitHub issue with the security-sensitive details minimized. Do not post secrets, private keys, real contact details, or real medical data in public issues.
