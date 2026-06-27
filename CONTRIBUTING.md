# Contributing

This repository is a Tatweer Hackathon submission project. Keep contributions focused on making Aounak clearer, safer, and easier to verify.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add Firebase web config values to `.env.local` if you need authenticated Firestore-backed flows. Leave `.env.local` untracked.

## Before Opening A Pull Request

Run:

```bash
npm run lint
npm run typecheck
npm run build
```

Also check:

- No secrets or private keys are committed.
- No real personal, location, phone, or medical data is included.
- Claims in README/docs are backed by code, screenshots, tests, or clearly marked as prototype/future work.
- UI changes preserve the guest SOS path.
- Firebase/auth/profile/SOS/responder/history/offline flows are not broken.

## Documentation Standard

Use careful wording. This app is a hackathon MVP and should not be described as a certified emergency dispatch system.

Good wording:

- "MVP implementation"
- "Prototype support"
- "Demo route estimate"
- "Requires field testing before real deployment"

Avoid wording:

- "Guaranteed faster response"
- "Fully production-ready emergency dispatch"
- "Works perfectly offline everywhere"
- "AI diagnosis"
