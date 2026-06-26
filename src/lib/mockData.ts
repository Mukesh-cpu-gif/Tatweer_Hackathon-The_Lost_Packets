import { Coordinates } from "./geo";

/**
 * SOS emergency categories — each maps to a visual icon
 * and a set of required responder skills.
 */
export type SOSCategory =
  | "snake_bite"
  | "medical"
  | "vehicle_stuck"
  | "sick_livestock"
  | "scorpion_sting"
  | "water_emergency";

export interface SOSType {
  id: SOSCategory;
  label: string;
  labelAr: string;
  icon: string;
  lucideIconName?: string;
  description: string;
  requiredSkills: string[];
  firstAid: string[];
  color: string;
  styleConfig?: {
    bg: string;
    border: string;
    text: string;
    hoverBg: string;
    iconColor: string;
  };
}

export interface Responder {
  id: number;
  name: string;
  phone: string;
  skills: string[];
  location: Coordinates;
  available: boolean;
  vehicleType: string;
  distanceKm?: number;
}

export interface Incident {
  id: string;
  type: SOSCategory;
  location: Coordinates;
  status: "pending" | "accepted" | "resolved";
  requiredSkills: string[];
  timestamp: string;
  requesterName: string;
  aiClassification?: string;
}

export interface WeatherAlert {
  id: string;
  type: "sandstorm" | "heatwave" | "flood";
  severity: "warning" | "danger" | "critical";
  title: string;
  titleAr: string;
  description: string;
  expiresAt: string;
}

// ─── SOS Categories ────────────────────────────────────────────────
export const sosTypes: SOSType[] = [
  {
    id: "snake_bite",
    label: "Snake Bite",
    labelAr: "لدغة أفعى",
    icon: "🐍",
    lucideIconName: "Activity",
    description: "Venomous snake bite requiring immediate anti-venom",
    requiredSkills: ["Medical", "Anti-Venom"],
    firstAid: [
      "Keep the bitten area still and below heart level.",
      "Do NOT apply a tourniquet or ice.",
      "Remove any jewelry near the bite before swelling starts.",
      "Note the time of the bite for responders.",
      "If possible, photograph the snake from a safe distance.",
    ],
    color: "from-red-600 to-red-800",
    styleConfig: {
      bg: "bg-rose-500/10",
      border: "border-rose-500/30",
      text: "text-rose-400",
      hoverBg: "hover:bg-rose-500/20",
      iconColor: "text-rose-500",
    },
  },
  {
    id: "scorpion_sting",
    label: "Scorpion Sting",
    labelAr: "لدغة عقرب",
    icon: "🦂",
    lucideIconName: "Bug",
    description: "Scorpion sting — may require anti-venom",
    requiredSkills: ["Medical"],
    firstAid: [
      "Wash the area with soap and water.",
      "Apply a cold compress to reduce swelling.",
      "Keep the person calm and still.",
      "Do NOT cut the wound or try to suck the venom.",
    ],
    color: "from-orange-600 to-red-700",
    styleConfig: {
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
      text: "text-orange-400",
      hoverBg: "hover:bg-orange-500/20",
      iconColor: "text-orange-500",
    },
  },
  {
    id: "medical",
    label: "Medical Assist",
    labelAr: "مساعدة طبية",
    icon: "🏥",
    lucideIconName: "HeartPulse",
    description: "General medical emergency or heatstroke",
    requiredSkills: ["Medical", "First Aid"],
    firstAid: [
      "If heatstroke: move to shade, cool with water, fan the person.",
      "If unconscious: place in recovery position.",
      "Loosen any tight clothing.",
      "Do NOT give water to an unconscious person.",
    ],
    color: "from-rose-600 to-pink-800",
    styleConfig: {
      bg: "bg-pink-500/10",
      border: "border-pink-500/30",
      text: "text-pink-400",
      hoverBg: "hover:bg-pink-500/20",
      iconColor: "text-pink-500",
    },
  },
  {
    id: "vehicle_stuck",
    label: "Vehicle Stuck",
    labelAr: "مركبة عالقة",
    icon: "🚜",
    lucideIconName: "Tractor",
    description: "Vehicle stuck in sand or broken down in the desert",
    requiredSkills: ["Winch", "4x4", "Heavy Machinery"],
    firstAid: [
      "Stay with your vehicle — it is easier to spot than a person.",
      "Turn on hazard lights if the battery allows.",
      "Conserve water. Drink small sips regularly.",
      "Use a reflective surface to signal for help during daylight.",
    ],
    color: "from-amber-600 to-yellow-800",
    styleConfig: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-400",
      hoverBg: "hover:bg-amber-500/20",
      iconColor: "text-amber-500",
    },
  },
  {
    id: "sick_livestock",
    label: "Sick Livestock",
    labelAr: "مواشي مريضة",
    icon: "🐪",
    lucideIconName: "Stethoscope",
    description: "Camel or livestock medical emergency",
    requiredSkills: ["Livestock Expert", "Veterinary"],
    firstAid: [
      "Isolate the sick animal from the rest of the herd.",
      "Provide shade and water if the animal can drink.",
      "Note symptoms: lethargy, refusal to eat, discharge.",
      "Do NOT administer medication without vet guidance.",
    ],
    color: "from-amber-700 to-orange-900",
    styleConfig: {
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      text: "text-yellow-400",
      hoverBg: "hover:bg-yellow-500/20",
      iconColor: "text-yellow-500",
    },
  },
  {
    id: "water_emergency",
    label: "Water Emergency",
    labelAr: "طوارئ مياه",
    icon: "💧",
    lucideIconName: "Droplet",
    description: "Water pump failure or supply cut-off",
    requiredSkills: ["Plumbing", "Heavy Machinery"],
    firstAid: [
      "Ration remaining water immediately.",
      "Check if the pump has a manual override.",
      "Contact your nearest neighbor for emergency supply.",
    ],
    color: "from-blue-600 to-cyan-800",
    styleConfig: {
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/30",
      text: "text-cyan-400",
      hoverBg: "hover:bg-cyan-500/20",
      iconColor: "text-cyan-500",
    },
  },
];

// ─── Mock Responders (Al Qua'a Volunteers) ─────────────────────────
export const mockResponders: Responder[] = [
  {
    id: 1,
    name: "Ahmed Al Dhaheri",
    phone: "+971501234567",
    skills: ["Medical", "First Aid", "4x4"],
    location: { lat: 23.541, lng: 55.489 },
    available: true,
    vehicleType: "Toyota Land Cruiser",
  },
  {
    id: 2,
    name: "Mohammed Al Kaabi",
    phone: "+971502345678",
    skills: ["Winch", "Heavy Machinery", "4x4"],
    location: { lat: 23.55, lng: 55.495 },
    available: true,
    vehicleType: "Nissan Patrol (Winch)",
  },
  {
    id: 3,
    name: "Ali Al Mansouri",
    phone: "+971503456789",
    skills: ["Livestock Expert", "Veterinary", "4x4"],
    location: { lat: 23.535, lng: 55.48 },
    available: true,
    vehicleType: "Toyota Hilux",
  },
  {
    id: 4,
    name: "Saeed Al Rumaithi",
    phone: "+971504567890",
    skills: ["Medical", "Anti-Venom"],
    location: { lat: 23.548, lng: 55.502 },
    available: false,
    vehicleType: "Ford Raptor",
  },
  {
    id: 5,
    name: "Khalid Al Shamsi",
    phone: "+971505678901",
    skills: ["Plumbing", "Heavy Machinery", "Winch"],
    location: { lat: 23.56, lng: 55.475 },
    available: true,
    vehicleType: "GMC Sierra",
  },
];

// ─── Mock Active Incidents ─────────────────────────────────────────
export const mockIncidents: Incident[] = [
  {
    id: "INC-1042",
    type: "vehicle_stuck",
    location: { lat: 23.545, lng: 55.49 },
    status: "pending",
    requiredSkills: ["Winch", "4x4"],
    timestamp: new Date(Date.now() - 4 * 60000).toISOString(),
    requesterName: "Farm Worker (Site 7)",
  },
  {
    id: "INC-1043",
    type: "snake_bite",
    location: { lat: 23.53, lng: 55.47 },
    status: "accepted",
    requiredSkills: ["Medical", "Anti-Venom"],
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    requesterName: "Rajesh K.",
    aiClassification: "Arabian Horned Viper (High Confidence)",
  },
  {
    id: "INC-1044",
    type: "sick_livestock",
    location: { lat: 23.555, lng: 55.485 },
    status: "pending",
    requiredSkills: ["Livestock Expert"],
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    requesterName: "Hamad S.",
  },
];

// ─── Mock Weather Alerts (Risk Radar) ──────────────────────────────
export const mockWeatherAlerts: WeatherAlert[] = [
  {
    id: "WX-001",
    type: "sandstorm",
    severity: "warning",
    title: "Sandstorm approaching from the west",
    titleAr: "عاصفة رملية قادمة من الغرب",
    description:
      "Expected to reach Al Qua'a within 2 hours. Winds up to 60 km/h. Secure livestock and seek shelter.",
    expiresAt: new Date(Date.now() + 2 * 3600000).toISOString(),
  },
  {
    id: "WX-002",
    type: "heatwave",
    severity: "danger",
    title: "Extreme heat advisory",
    titleAr: "تحذير من حرارة شديدة",
    description:
      "Temperatures expected to reach 52°C. Limit outdoor activity between 11 AM and 4 PM. Ensure water supply for livestock.",
    expiresAt: new Date(Date.now() + 8 * 3600000).toISOString(),
  },
];
