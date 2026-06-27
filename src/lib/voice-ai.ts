import { SOSCategory } from "./mockData";

export interface ParsedVoiceEmergency {
  type: SOSCategory;
  name: string;
  phone: string;
  passengers: number;
  notes: string;
  specifics: string;
  bodyPart: string;
}

// Smart offline-first keyword classifier and entity extractor
export function parseVoiceInput(text: string): ParsedVoiceEmergency {
  const normalized = text.toLowerCase().trim();

  // ─── 1. Classify Crisis Type ───
  let type: SOSCategory = "medical"; // Default fallback

  const keywords: Record<SOSCategory, string[]> = {
    venomous_bite: ["snake", "scorpion", "bite", "bit", "stung", "sting", "venom", "poison", "fang", "viper"],
    out_of_fuel: ["fuel", "gas", "petrol", "diesel", "empty", "refuel"],
    vehicle_stuck: ["stuck", "sand", "dune", "deflation", "winch", "recovery", "tractor", "tire", "tyre", "mud"],
    sick_livestock: ["camel", "livestock", "sheep", "goat", "animal", "cow", "vet", "camel", "herd", "horse", "falcon", "parrot", "cat", "dog", "veterinarian", "lamb", "foal", "calf", "chick", "kitten", "puppy"],
    water_emergency: ["water", "pump", " thirsty", "leak", "dehydrate", "no water"],
    medical: ["medical", "doctor", "pain", "bleeding", "chest", "breath", "heart", "injury", "sick"],
  };

  // Find category with most matching keywords
  let maxMatches = 0;
  for (const cat of Object.keys(keywords) as SOSCategory[]) {
    let matches = 0;
    for (const kw of keywords[cat]) {
      if (normalized.includes(kw)) matches++;
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      type = cat;
    }
  }

  // Double check direct matches for high priority
  if (normalized.includes("snake") || normalized.includes("viper") || normalized.includes("scorpion")) {
    type = "venomous_bite";
  } else if (normalized.includes("fuel") || normalized.includes("petrol") || normalized.includes("gasoline")) {
    type = "out_of_fuel";
  } else if (normalized.includes("stuck") || normalized.includes("sand")) {
    type = "vehicle_stuck";
  } else if (
    normalized.includes("camel") ||
    normalized.includes("livestock") ||
    normalized.includes("sheep") ||
    normalized.includes("goat") ||
    normalized.includes("cow") ||
    normalized.includes("horse") ||
    normalized.includes("falcon") ||
    normalized.includes("parrot") ||
    normalized.includes("cat") ||
    normalized.includes("dog") ||
    normalized.includes("vet") ||
    normalized.includes("veterinarian")
  ) {
    type = "sick_livestock";
  }

  // ─── 2. Extract Phone Number ───
  let phone = "";
  // Matches digit sequences that can be separated by spaces or dashes (e.g. 052 1404918 or 052-140-4918)
  const phoneGroupRegex = /\b\d{2,4}(?:[\s-]?\d{2,6}){1,4}\b/g;
  const phoneMatches = normalized.match(phoneGroupRegex);
  if (phoneMatches) {
    for (const match of phoneMatches) {
      const cleaned = match.replace(/[\s-]/g, "");
      // Valid phone numbers are between 7 and 12 digits
      if (cleaned.length >= 7 && cleaned.length <= 12) {
        phone = cleaned;
        break;
      }
    }
  }

  // Fallback to strict digits if grouping search failed
  if (!phone) {
    const phoneRegex = /\b\d{7,12}\b/;
    const phoneMatch = normalized.match(phoneRegex);
    if (phoneMatch) {
      phone = phoneMatch[0];
    }
  }

  // ─── 3. Extract Name ───
  let name = "";
  // Check common patterns
  const namePatterns = [
    /name\s+is\s+([a-zA-Z\s]+?)(?:,|\.|$|\band\b|\bphone\b|\bnumber\b)/i,
    /name's\s+([a-zA-Z\s]+?)(?:,|\.|$|\band\b|\bphone\b)/i,
    /called\s+([a-zA-Z\s]+?)(?:,|\.|$|\band\b|\bphone\b)/i,
    /i\s+am\s+([a-zA-Z\s]+?)(?:,|\.|$|\band\b|\bphone\b)/i,
    /im\s+([a-zA-Z\s]+?)(?:,|\.|$|\band\b|\bphone\b)/i,
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const parsedName = match[1].trim();
      // Keep it short (max 2 words) to avoid catching surrounding text
      if (parsedName.split(/\s+/).length <= 2) {
        name = parsedName;
        break;
      }
    }
  }

  // ─── 4. Extract Passengers / Alone ───
  let passengers = 1;
  if (normalized.includes("alone") || normalized.includes("myself") || normalized.includes("i am by myself")) {
    passengers = 1;
  } else {
    const peoplePatterns = [
      /we\s+are\s+(\d+)\s+(?:people|passengers|person|adults|kids)/i,
      /(\d+)\s+people/i,
      /(\d+)\s+passengers/i,
      /(\d+)\s+of\s+us/i,
    ];
    for (const pattern of peoplePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        passengers = parseInt(match[1]) || 1;
        break;
      }
    }
  }

  // ─── 5. Extract Notes & Specific Details ───
  // Notes contain the crisis conditions (symptoms, severity, etc.)
  const notesParts: string[] = [];
  
  if (normalized.includes("severe pain")) notesParts.push("Severe pain reported");
  if (normalized.includes("fang marks") || normalized.includes("fangs")) notesParts.push("2 fang marks detected");
  if (normalized.includes("foot") || normalized.includes("leg")) {
    const footMatch = text.match(/\b(left|right)?\s*(foot|leg|toe)\b/i);
    notesParts.push(`Bite location: ${footMatch ? footMatch[0].trim() : "leg/foot"}`);
  }
  if (normalized.includes("headache") || normalized.includes("dizzy")) notesParts.push("Symptom: Dizziness/Headache");

  // General fallback for notes: collect sentences that don't talk about phone or name
  const sentences = text.split(/[.,]/);
  const generalNotes = sentences
    .map(s => s.trim())
    .filter(s => {
      const sl = s.toLowerCase();
      return (
        sl.length > 5 &&
        !sl.includes("name is") &&
        !sl.includes("my name") &&
        !sl.includes("phone number") &&
        !sl.match(/\b\d{7,12}\b/)
      );
    })
    .join(". ");

  let notes = notesParts.length ? notesParts.join(". ") : generalNotes;
  if (!notes) {
    notes = text; // Fallback to raw text
  }

  // ─── 6. Extract Specifics (e.g. Snake description or fuel specs) ───
  let specifics = "";
  if (type === "venomous_bite") {
    // Look for snake description
    const snakeDescPattern = /(?:snake|scorpion)\s+(?:was|is)\s+([a-zA-Z\s]+?)(?:\.|$|,)/i;
    const match = text.match(snakeDescPattern);
    if (match && match[1]) {
      specifics = match[0].trim();
    } else {
      // Find color keywords + horns etc.
      const features = [];
      const colors = ["yellow", "black", "brown", "grey", "gray", "red", "green"];
      for (const color of colors) {
        if (normalized.includes(color)) {
          features.push(`${color} color`);
        }
      }
      if (normalized.includes("horn")) features.push("horned head structure");
      if (normalized.includes("alone")) features.push("alone");
      
      specifics = features.length 
        ? `Animal: ${features.join(", ")}` 
        : "Snake bite reported in desert.";
    }
  } else if (type === "out_of_fuel") {
    // Find fuel type if mentioned
    if (normalized.includes("diesel")) specifics = "Required fuel: Diesel";
    else if (normalized.includes("super") || normalized.includes("98") || normalized.includes("95")) specifics = "Required fuel: Octane Petrol";
    else specifics = "Required fuel: Standard Petrol";
  } else if (type === "vehicle_stuck") {
    if (normalized.includes("dune") || normalized.includes("high sand")) specifics = "Stuck in high dunes";
    else if (normalized.includes("mud") || normalized.includes("sabkha")) specifics = "Stuck in sabkha wet sand";
    else specifics = "Standard recovery required";
  } else if (type === "sick_livestock") {
    const animalsList = ["camel", "goat", "sheep", "cow", "horse", "falcon", "parrot", "cat", "dog"];
    let detectedAnimal = "";
    for (const animal of animalsList) {
      if (normalized.includes(animal)) {
        detectedAnimal = animal;
        break;
      }
    }
    if (detectedAnimal) {
      specifics = `Animal profile: ${detectedAnimal.charAt(0).toUpperCase() + detectedAnimal.slice(1)}`;
    } else {
      specifics = "Animal profile: Livestock";
    }
  } else if (type === "medical") {
    specifics = parseBodyPart(text);
  }

  const bodyPart = parseBodyPart(text);

  return {
    type,
    name: name || "Emergency Guest",
    phone: phone || "0500000000",
    passengers,
    notes,
    specifics,
    bodyPart,
  };
}

// Utility to parse human body injury locations from text
export function parseBodyPart(text: string): string {
  const norm = text.toLowerCase();
  if (norm.includes("head") || norm.includes("neck") || norm.includes("face") || norm.includes("throat")) return "Head & Neck";
  if (norm.includes("torso") || norm.includes("chest") || norm.includes("stomach") || norm.includes("back") || norm.includes("abdomen") || norm.includes("belly")) return "Torso";
  
  if (norm.includes("right arm") || norm.includes("right hand") || norm.includes("right elbow") || norm.includes("right shoulder") || norm.includes("right wrist")) return "Right Arm";
  if (norm.includes("left arm") || norm.includes("left hand") || norm.includes("left elbow") || norm.includes("left shoulder") || norm.includes("left wrist")) return "Left Arm";
  if (norm.includes("arm") || norm.includes("hand") || norm.includes("shoulder") || norm.includes("elbow") || norm.includes("wrist")) {
    if (norm.includes("left")) return "Left Arm";
    return "Right Arm";
  }

  if (norm.includes("right leg") || norm.includes("right thigh") || norm.includes("right knee") || norm.includes("right shin")) return "Right Leg";
  if (norm.includes("left leg") || norm.includes("left thigh") || norm.includes("left knee") || norm.includes("left shin")) return "Left Leg";
  
  if (norm.includes("right foot") || norm.includes("right toe") || norm.includes("right ankle") || norm.includes("right heel")) return "Right Foot";
  if (norm.includes("left foot") || norm.includes("left toe") || norm.includes("left ankle") || norm.includes("left heel")) return "Left Foot";
  
  if (norm.includes("foot") || norm.includes("toe") || norm.includes("ankle")) {
    if (norm.includes("left")) return "Left Foot";
    return "Right Foot";
  }
  if (norm.includes("leg") || norm.includes("knee") || norm.includes("thigh")) {
    if (norm.includes("left")) return "Left Leg";
    return "Right Leg";
  }

  return "";
}
