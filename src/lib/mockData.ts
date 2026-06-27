import { Coordinates } from "./geo";

/**
 * SOS emergency categories — each maps to a visual icon
 * and a set of required responder skills.
 */
export type SOSCategory =
  | "venomous_bite"
  | "medical"
  | "vehicle_stuck"
  | "sick_livestock"
  | "out_of_fuel"
  | "water_emergency";

export interface SOSType {
  id: SOSCategory;
  label: string;
  labelAr: string;
  icon: string;
  lucideIconName?: string;
  description: string;
  descriptionAr?: string;
  requiredSkills: string[];
  firstAid: string[];
  firstAidAr?: string[];
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
  id: string;
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
  isVoiceCommand?: boolean;
  aiClassification?: string;
  clientSessionId?: string;
  createdByUid?: string;
  responderCounts?: {
    notified: number;
    enRoute: number;
  };
  acceptedBy?: string[];
  acceptedByNames?: string[];
}

export interface WeatherAlert {
  id: string;
  type: "sandstorm" | "heatwave" | "flood";
  severity: "warning" | "danger" | "critical";
  title: string;
  titleAr: string;
  description: string;
  descriptionAr?: string;
  expiresAt: string;
}

// ─── SOS Categories ────────────────────────────────────────────────
export const sosTypes: SOSType[] = [
  {
    id: "venomous_bite",
    label: "Venomous Threat",
    labelAr: "تهديد سام",
    icon: "🦂",
    lucideIconName: "Bug",
    description: "Snake bite or scorpion sting requiring immediate anti-venom",
    descriptionAr: "لدغة أفعى أو لسعة عقرب تتطلب ترياقاً فورياً",
    requiredSkills: ["Medical", "Anti-Venom"],
    firstAid: [
      "Keep the affected area still and below heart level.",
      "Wash the area with soap and water if possible.",
      "Do NOT apply a tourniquet, ice, or cut the wound.",
      "Note the time of the bite/sting for responders.",
      "If possible, photograph the creature from a safe distance.",
    ],
    firstAidAr: [
      "حافظ على هدوء المصاب وثبات العضو المصاب تحت مستوى القلب.",
      "اغسل المنطقة بالماء والصابون إذا كان ذلك ممكناً.",
      "لا تستخدم عصبة (مربطاً)، أو ثلجاً، أو تشق الجرح.",
      "سجل وقت اللدغة/اللسعة للمستجيبين.",
      "إذا كان ذلك ممكناً، التقط صورة للمخلوق من مسافة آمنة."
    ],
    color: "from-red-600 to-red-800",
    styleConfig: {
      bg: "bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 hover:bg-rose-950/20 hover:border-t-rose-400/50 hover:border-r-transparent hover:border-b-transparent hover:border-l-transparent hover:shadow-[0_0_30px_rgba(244,63,94,0.15)] hover:-translate-y-1.5 transition-all duration-500 ease-out",
      border: "border-zinc-800/50",
      text: "text-zinc-200",
      hoverBg: "hover:bg-rose-950/20",
      iconColor: "text-rose-500",
    },
  },
  {
    id: "out_of_fuel",
    label: "Out of Fuel",
    labelAr: "نفاد الوقود",
    icon: "⛽",
    lucideIconName: "Fuel",
    description: "Vehicle stranded without fuel in the desert",
    descriptionAr: "مركبة عالقة بدون وقود في الصحراء",
    requiredSkills: ["Transport", "Fuel Supply", "4x4"],
    firstAid: [
      "Stay with your vehicle — do NOT attempt to walk to find fuel.",
      "Turn on hazard lights or use a reflective surface.",
      "Conserve water and stay in the shade of the vehicle.",
    ],
    firstAidAr: [
      "ابق مع مركبتك — لا تحاول المشي للبحث عن وقود.",
      "قم بتشغيل أضواء التحذير (الرباعي) أو استخدم سطحاً عاكساً.",
      "حافظ على المياه المتبقية وابتدأ بالجلوس في ظل المركبة."
    ],
    color: "from-blue-600 to-indigo-800",
    styleConfig: {
      bg: "bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 hover:bg-indigo-950/20 hover:border-t-indigo-400/50 hover:border-r-transparent hover:border-b-transparent hover:border-l-transparent hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] hover:-translate-y-1.5 transition-all duration-500 ease-out",
      border: "border-zinc-800/50",
      text: "text-zinc-200",
      hoverBg: "hover:bg-indigo-950/20",
      iconColor: "text-indigo-500",
    },
  },
  {
    id: "medical",
    label: "Medical Assist",
    labelAr: "مساعدة طبية",
    icon: "🏥",
    lucideIconName: "HeartPulse",
    description: "General medical emergency or heatstroke",
    descriptionAr: "حالة طبية طارئة عامة أو ضربة شمس",
    requiredSkills: ["Medical", "First Aid"],
    firstAid: [
      "If heatstroke: move to shade, cool with water, fan the person.",
      "If unconscious: place in recovery position.",
      "Loosen any tight clothing.",
      "Do NOT give water to an unconscious person.",
    ],
    firstAidAr: [
      "في حالة ضربة الشمس: انتقل إلى الظل، برد المصاب بالماء، وقم بتهويته.",
      "في حالة فقدان الوعي: وضع المصاب في وضعية الإفاقة الجانبية.",
      "قم بإرخاء أي ملابس ضيقة.",
      "لا تعطِ الماء للشخص الفاقد للوعي."
    ],
    color: "from-rose-600 to-pink-800",
    styleConfig: {
      bg: "bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 hover:bg-pink-950/20 hover:border-t-pink-400/50 hover:border-r-transparent hover:border-b-transparent hover:border-l-transparent hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] hover:-translate-y-1.5 transition-all duration-500 ease-out",
      border: "border-zinc-800/50",
      text: "text-zinc-200",
      hoverBg: "hover:bg-pink-950/20",
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
    descriptionAr: "مركبة عالقة في الرمال أو معطلة في الصحراء",
    requiredSkills: ["Winch", "4x4", "Heavy Machinery"],
    firstAid: [
      "Stay with your vehicle — it is easier to spot than a person.",
      "Turn on hazard lights if the battery allows.",
      "Conserve water. Drink small sips regularly.",
      "Use a reflective surface to signal for help during daylight.",
    ],
    firstAidAr: [
      "ابق مع مركبتك — فمن السهل رؤية المركبة مقارنة بالشخص.",
      "قم بتشغيل أضواء التحذير إذا كانت البطارية تسمح بذلك.",
      "حافظ على المياه. اشرب رشفات صغيرة بانتظام.",
      "استخدم سطحاً عاكساً للإشارة لطلب المساعدة خلال النهار."
    ],
    color: "from-amber-600 to-yellow-800",
    styleConfig: {
      bg: "bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 hover:bg-amber-950/20 hover:border-t-amber-400/50 hover:border-r-transparent hover:border-b-transparent hover:border-l-transparent hover:shadow-[0_0_30px_rgba(251,191,36,0.15)] hover:-translate-y-1.5 transition-all duration-500 ease-out",
      border: "border-zinc-800/50",
      text: "text-zinc-200",
      hoverBg: "hover:bg-amber-950/20",
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
    descriptionAr: "حالة طوارئ طبية للإبل أو المواشي",
    requiredSkills: ["Livestock Expert", "Veterinary"],
    firstAid: [
      "Isolate the sick animal from the rest of the herd.",
      "Provide shade and water if the animal can drink.",
      "Note symptoms: lethargy, refusal to eat, discharge.",
      "Do NOT administer medication without vet guidance.",
    ],
    firstAidAr: [
      "اعزل الحيوان المريض عن بقية القطيع.",
      "وفر الظل والماء إذا كان الحيوان قادراً على الشرب.",
      "سجل الأعراض: خمول، رفض الأكل، إفرازات.",
      "لا تعطِ أي علاج دون استشارة الطبيب البيطري."
    ],
    color: "from-amber-700 to-orange-900",
    styleConfig: {
      bg: "bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 hover:bg-yellow-950/20 hover:border-t-yellow-400/50 hover:border-r-transparent hover:border-b-transparent hover:border-l-transparent hover:shadow-[0_0_30px_rgba(250,204,21,0.15)] hover:-translate-y-1.5 transition-all duration-500 ease-out",
      border: "border-zinc-800/50",
      text: "text-zinc-200",
      hoverBg: "hover:bg-yellow-950/20",
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
    descriptionAr: "عطل في مضخة المياه أو انقطاع في الإمداد",
    requiredSkills: ["Plumbing", "Heavy Machinery"],
    firstAid: [
      "Ration remaining water immediately.",
      "Check if the pump has a manual override.",
      "Contact your nearest neighbor for emergency supply.",
    ],
    firstAidAr: [
      "رشد المياه المتبقية على الفور.",
      "تحقق مما إذا كانت المضخة تحتوي على زر تجاوز يدوي.",
      "اتصل بأقرب جار للحصول على إمدادات الطوارئ."
    ],
    color: "from-blue-600 to-cyan-800",
    styleConfig: {
      bg: "bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 hover:bg-sky-950/20 hover:border-t-sky-400/50 hover:border-r-transparent hover:border-b-transparent hover:border-l-transparent hover:shadow-[0_0_30px_rgba(56,189,248,0.15)] hover:-translate-y-1.5 transition-all duration-500 ease-out",
      border: "border-zinc-800/50",
      text: "text-zinc-200",
      hoverBg: "hover:bg-sky-950/20",
      iconColor: "text-sky-500",
    },
  },
];

const MOCK_NOW = new Date("2026-06-26T14:00:00+04:00").getTime();

// ─── Mock Responders (Al Qua'a Volunteers) ─────────────────────────
export const mockResponders: Responder[] = [
  {
    id: "1",
    name: "Ahmed Al Dhaheri",
    phone: "+971501234567",
    skills: ["Medical", "First Aid", "4x4"],
    location: { lat: 23.541, lng: 55.489 },
    available: true,
    vehicleType: "Toyota Land Cruiser",
  },
  {
    id: "2",
    name: "Mohammed Al Kaabi",
    phone: "+971502345678",
    skills: ["Winch", "Heavy Machinery", "4x4"],
    location: { lat: 23.55, lng: 55.495 },
    available: true,
    vehicleType: "Nissan Patrol (Winch)",
  },
  {
    id: "3",
    name: "Ali Al Mansouri",
    phone: "+971503456789",
    skills: ["Livestock Expert", "Veterinary", "4x4"],
    location: { lat: 23.535, lng: 55.48 },
    available: true,
    vehicleType: "Toyota Hilux",
  },
  {
    id: "4",
    name: "Saeed Al Rumaithi",
    phone: "+971504567890",
    skills: ["Medical", "Anti-Venom"],
    location: { lat: 23.548, lng: 55.502 },
    available: false,
    vehicleType: "Ford Raptor",
  },
  {
    id: "5",
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
    timestamp: new Date(MOCK_NOW - 4 * 60000).toISOString(),
    requesterName: "Farm Worker (Site 7)",
    clientSessionId: "seeded-demo",
    responderCounts: { notified: 3, enRoute: 0 },
    acceptedBy: [],
    acceptedByNames: [],
  },
  {
    id: "INC-1043",
    type: "venomous_bite",
    location: { lat: 23.53, lng: 55.47 },
    status: "accepted",
    requiredSkills: ["Medical", "Anti-Venom"],
    timestamp: new Date(MOCK_NOW - 12 * 60000).toISOString(),
    requesterName: "Rajesh K.",
    aiClassification: "Arabian Horned Viper (High Confidence)",
    clientSessionId: "seeded-demo",
    responderCounts: { notified: 2, enRoute: 1 },
    acceptedBy: ["seeded-helper"],
    acceptedByNames: ["Saeed Al Rumaithi"],
  },
  {
    id: "INC-1044",
    type: "sick_livestock",
    location: { lat: 23.555, lng: 55.485 },
    status: "pending",
    requiredSkills: ["Livestock Expert"],
    timestamp: new Date(MOCK_NOW - 2 * 60000).toISOString(),
    requesterName: "Hamad S.",
    clientSessionId: "seeded-demo",
    responderCounts: { notified: 2, enRoute: 0 },
    acceptedBy: [],
    acceptedByNames: [],
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
    descriptionAr: "من المتوقع أن تصل إلى القوع خلال ساعتين. رياح تصل سرعتها إلى 60 كم/ساعة. يرجى تأمين المواشي والبحث عن مأوى.",
    expiresAt: new Date(MOCK_NOW + 2 * 3600000).toISOString(),
  },
  {
    id: "WX-002",
    type: "heatwave",
    severity: "danger",
    title: "Extreme heat advisory",
    titleAr: "تحذير من حرارة شديدة",
    description:
      "Temperatures expected to reach 52°C. Limit outdoor activity between 11 AM and 4 PM. Ensure water supply for livestock.",
    descriptionAr: "من المتوقع أن تصل درجات الحرارة إلى 52 درجة مئوية. يرجى الحد من الأنشطة الخارجية بين الساعة 11 صباحاً و4 مساءً وتأمين المياه للمواشي.",
    expiresAt: new Date(MOCK_NOW + 8 * 3600000).toISOString(),
  },
];

// ─── Blockades & Hazards ──────────────────────────────────────────
export interface Blockade {
  id: string;
  name: string;
  type: "sand_dune" | "flood" | "military_zone" | "accident";
  location: Coordinates;
  radiusKm: number;
}

export const mockBlockades: Blockade[] = [
  {
    id: "BLK-001",
    name: "Unstable Dune Collapse",
    type: "sand_dune",
    location: { lat: 23.535, lng: 55.478 },
    radiusKm: 0.35, // 350 meters radius
  },
];

// ─── Safe Routes ──────────────────────────────────────────────────
export interface SafeRoute {
  id: string;
  name: string;
  creatorName: string;
  path: Coordinates[];
  difficulty: "easy" | "moderate" | "hard";
  vehicleRequirements: string;
  createdAt: string;
  startPoint: Coordinates;
  endPoint: Coordinates;
}

export const mockSafeRoutes: SafeRoute[] = [
  {
    id: "SR-001",
    name: "Al Qua'a Western Dune Pass",
    creatorName: "Ahmed Al Dhaheri",
    path: [
      { lat: 23.55, lng: 55.485 },
      { lat: 23.545, lng: 55.48 },
      { lat: 23.54, lng: 55.472 },
      { lat: 23.53, lng: 55.47 },
    ],
    difficulty: "easy",
    vehicleRequirements: "4x4 & 15 PSI recommended",
    createdAt: new Date(MOCK_NOW - 2 * 24 * 3600000).toISOString(),
    startPoint: { lat: 23.55, lng: 55.485 },
    endPoint: { lat: 23.53, lng: 55.47 },
  },
];
