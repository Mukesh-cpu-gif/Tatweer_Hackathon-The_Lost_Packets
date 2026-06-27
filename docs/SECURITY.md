# Security

## Data Boundaries

The app separates private and public-safe data:

| Area                                       | Data                                                 |
| ------------------------------------------ | ---------------------------------------------------- |
| `profiles/{uid}`                           | Private profile details readable only by the owner   |
| `responderDirectory/{uid}`                 | Public-safe responder matching fields                |
| `incidents/{incidentId}`                   | Public-safe SOS summary                              |
| `incidents/{incidentId}/blocks/{blockKey}` | Optional request details readable by signed-in users |

Firestore rules are included in `firestore.rules`. They should be reviewed and deployed before using real users.

## Emergency Safety

Aounak is not a certified emergency dispatch platform. Any real deployment must include:

- Verified responders.
- Emergency-service escalation policies.
- Privacy and data retention policies.
- Field testing and local authority/community approval.
