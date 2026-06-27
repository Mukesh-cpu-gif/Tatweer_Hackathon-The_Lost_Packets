<style>
img {
  max-width: 120px;
  height: auto;
}

td {
  vertical-align: top;
}
</style>

# Evidence and Testing

This document outlines the primary features of Aounak and their validation steps. It combines our end-to-end testing script with the main feature evidence, providing a single source of truth for the application's capabilities. Only core features that can be visually demonstrated are included.

## Main Features & Validation

| Feature / Action                 | Expected Result                                                                                              | Screenshot                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| **Public Emergency Flow**        | Welcome screen loads with SOS, login, and register actions, allowing public access without registration.     | ![welcome.png](screenshots/welcome.png)                       |
| **SOS Selection Grid**           | Emergency type grid appears with options like Vehicle Stuck, Venomous Bite, Medical Assist, etc.             | ![sos-selection.png](screenshots/sos-selection.png)           |
| **SOS Reporting & Coordinates**  | Specific report page opens with a coordinates panel, live digital SOS button, and optional detail forms.     | ![sos-medical-assist.png](screenshots/sos-medical-assist.png) |
| **Voice-Commanded SOS AI**       | Microphone UI records emergency details, parses the NLP offline, and automatically fills the incident form.  | ![voice-ai.png](screenshots/voice-ai.png)                     |
| **Interactive Medical Selector** | Reusable visual Body Location Selector appears for Venomous Bites and Medical Assist to pinpoint injuries.   | ![body-selector.png](screenshots/body-selector.png)           |
| **Offline SMS Fallback**         | An SMS deep link triggers, opening the native SMS app pre-filled with the emergency type and coordinates.    | ![offline-sms.png](screenshots/offline-sms.png)               |
| **Dual Language Support**        | Toggling the language button seamlessly switches between English and Arabic, including RTL layout support.   | ![dual-language.png](screenshots/dual-language.png)           |
| **Profile Readiness**            | Profile page captures contact info, vehicle details, skills, and medical notes for authenticated responders. | ![profile-readiness.png](screenshots/profile-readiness.png)   |
| **Home Dashboard**               | Dashboard shows active SOS tiles, map previews, and recent community activity state.                         | ![recent-activity.png](screenshots/recent-activity.png)       |
| **Activity History**             | History page displays a chronological log of incidents created or helped by the current user.                | ![history.png](screenshots/history.png)                       |
| **Interactive Map Routing**      | Hybrid paved-to-offroad routing engine displays the route to an incident alongside active hazard reports.    | ![map-route.png](screenshots/map-route.png)                   |
