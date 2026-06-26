import { Coordinates } from "./geo";

export function generateSmsDeepLink(phone: string, emergencyType: string, coords: Coordinates, extraInfo: string = "") {
  const googleMapsLink = `https://maps.google.com/?q=${coords.lat},${coords.lng}`;
  const message = `URGENT SOS - Aounak\nType: ${emergencyType}\nLocation: ${googleMapsLink}\n${extraInfo ? `Extra Info: ${extraInfo}` : ""}`;
  return `sms:${phone}?body=${encodeURIComponent(message)}`;
}
