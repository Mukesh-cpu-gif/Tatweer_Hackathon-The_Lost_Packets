# Testing

## Command Checks

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

## Manual End-to-End Test

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

## Test Data Rules

- Use only fake names, emails, phone numbers, and incident details.
- Use Al Qua'a fallback/demo coordinates when browser location is blocked.
- Do not send real SMS messages during testing.
- Do not commit `.env.local`, Firebase private keys, screenshots with real data, or generated build folders.
