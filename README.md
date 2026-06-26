# Aounak

Aounak is a Next.js, React, TypeScript, Tailwind, shadcn/ui, Firebase, and PWA project for a hyper-local emergency response network around Al Qua'a.

## Live Demo

Judges and users should open the deployed Vercel URL. They do not need a local `.env` file to use the deployed app.

## Running Locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add your Firebase web app config values to `.env.local` before using Firebase Authentication or Firestore locally.

## Environment Variables

`.env.local` is intentionally ignored and must not be committed. The client Firebase setup uses public Firebase web config variables:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Firebase client config is not a backend password. Protect app data through Firebase Authentication plus Firestore and Storage security rules. Never commit Firebase Admin SDK service account files or private keys.

## Vercel Deployment

1. Create a Vercel project from this repository.
2. Add the same `NEXT_PUBLIC_FIREBASE_*` variables in Vercel Project Settings > Environment Variables.
3. Redeploy after saving the variables.
4. If Firebase Authentication is enabled, add the Vercel domain in Firebase Console > Authentication > Settings > Authorized domains.

Starter Firestore rules are included in `firestore.rules` and referenced by `firebase.json`. Review and deploy them from the Firebase CLI once the final collection model is confirmed.

## Auth And Responder Profiles

Email/password and Google auth send users to the responder dashboard. New responders are no longer assigned fixed profile details; they must save their own name, phone number, vehicle, skills, availability, and optional GPS location.

Phone authentication uses Firebase Phone Auth and requires the Firebase project to be configured for phone sign-in and reCAPTCHA-compatible authorized domains.

## Troubleshooting Firebase

If the browser console shows `Firestore: Database '(default)' not found`, create a Firestore database in Firebase Console for the project in `.env.local`. If requests to `firestore.googleapis.com` show `ERR_BLOCKED_BY_CLIENT`, disable ad blockers/privacy extensions for `localhost` or the deployed Vercel domain.

The app includes local demo fallbacks so the UI remains usable when Firestore is missing or blocked, but real-time incident/profile sync requires Firestore to be enabled.

## Verification

```bash
npm run lint
npm run build
```
