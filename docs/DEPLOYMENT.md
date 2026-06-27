# Deployment

Aounak can be deployed to Vercel or Firebase Hosting. Vercel is the simplest path for a Next.js demo.

## Vercel

1. Create a Vercel project from this repository.
2. Add the public Firebase web config variables in Project Settings > Environment Variables.
3. Deploy the project.
4. In Firebase Console, add the deployed Vercel domain to Authentication > Settings > Authorized domains.
5. Deploy or review `firestore.rules` before using real users.

Required variables:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Firebase Hosting

1. Install and authenticate the Firebase CLI locally.
2. Confirm `firebase.json` points at the intended hosting setup.
3. Build the app with `npm run build`.
4. Deploy hosting and Firestore rules according to the final Firebase project configuration.

## Production Checks

- Confirm the deployed app loads over HTTPS.
- Confirm the PWA manifest and icons load.
- Confirm service worker registration works only in production.
- Confirm auth sign-in works on the deployed domain.
- Confirm Firestore rules are deployed.
- Confirm offline SMS fallback opens but does not send messages automatically.
- Confirm screenshots and demo video use fake data only.
