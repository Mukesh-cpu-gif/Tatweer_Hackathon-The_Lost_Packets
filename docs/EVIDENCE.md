# Evidence and Testing

This document outlines the primary features of Aounak and their validation steps. It combines our end-to-end testing script with the main feature evidence, providing a single source of truth for the application's capabilities. Only core features that can be visually demonstrated are included.

## Main Features & Validation

| Feature / Action | Expected Result | Screenshot |
|---|---|---|
| **Public Emergency Flow** | Welcome screen loads with SOS, login, and register actions, allowing public access without registration. | `docs/screenshots/01-welcome.png` |
| **SOS Selection Grid** | Emergency type grid appears with options like Vehicle Stuck, Venomous Bite, Medical Assist, etc. | `docs/screenshots/04-sos-selection.png` |
| **SOS Reporting & Coordinates** | Specific report page opens with a coordinates panel, live digital SOS button, and optional detail forms. | `docs/screenshots/05-sos-report-vehicle.png` |
| **Voice-Commanded SOS AI** | Microphone UI records emergency details, parses the NLP offline, and automatically fills the incident form. | `docs/screenshots/10-voice-ai-overlay.png` |
| **Interactive Medical Selector** | Reusable visual Body Location Selector appears for Venomous Bites and Medical Assist to pinpoint injuries. | `docs/screenshots/11-body-selector.png` |
| **Offline SMS Fallback** | An SMS deep link triggers, opening the native SMS app pre-filled with the emergency type and coordinates. | `docs/screenshots/12-offline-sms.png` |
| **Dual Language Support** | Toggling the language button seamlessly switches between English and Arabic, including RTL layout support. | `docs/screenshots/13-dual-language.png` |
| **Profile Readiness** | Profile page captures contact info, vehicle details, skills, and medical notes for authenticated responders. | `docs/screenshots/07-profile-readiness.png` |
| **Home Dashboard** | Dashboard shows active SOS tiles, map previews, and recent community activity state. | `docs/screenshots/06-home-dashboard.png` |
| **Activity History** | History page displays a chronological log of incidents created or helped by the current user. | `docs/screenshots/08-history.png` |
| **Responder Feed** | Authenticated responder feed lists active, nearby incidents sorted by distance. | `docs/screenshots/14-responder-feed.png` |
| **Interactive Map Routing** | Hybrid paved-to-offroad routing engine displays the route to an incident alongside active hazard reports. | `docs/screenshots/09-map-route-prototype.png` |

## Test Data Rules

- Use only fake names, emails, phone numbers, and incident details when generating evidence.
- Use Al Qua'a fallback/demo coordinates when browser location is blocked.
- Do not send real SMS messages during testing.
- Do not commit `.env.local` or Firebase private keys.
