/**
 * Dog CEO Breed Name Mapping
 *
 * Maps Dog CEO API breed identifiers to human-readable names.
 * This file contains all 174 breeds available in the Dog CEO API.
 *
 * Breed format from Dog CEO:
 * - Simple breeds: "beagle", "poodle"
 * - Sub-breeds: "bulldog-french", "retriever-golden"
 *
 * The mapping converts these to human-friendly display names.
 */

/**
 * Complete mapping of Dog CEO breed keys to human-readable names
 * Keys are in the format used by breed-images.json (hyphenated sub-breeds)
 */
export const DOG_CEO_BREED_MAP: Readonly<Record<string, string>> = {
  // A
  affenpinscher: "Affenpinscher",
  "african-wild": "African Wild Dog",
  airedale: "Airedale Terrier",
  akita: "Akita",
  appenzeller: "Appenzeller Sennenhund",

  // Australian breeds
  "australian-kelpie": "Australian Kelpie",
  "australian-shepherd": "Australian Shepherd",

  // B
  "bakharwal-indian": "Bakharwal Dog",
  basenji: "Basenji",
  beagle: "Beagle",
  bluetick: "Bluetick Coonhound",
  borzoi: "Borzoi",
  bouvier: "Bouvier des Flandres",
  boxer: "Boxer",
  brabancon: "Petit Brabançon",
  briard: "Briard",
  "buhund-norwegian": "Norwegian Buhund",

  // Bulldogs
  "bulldog-boston": "Boston Terrier", // Often listed as bulldog but is a terrier
  "bulldog-english": "English Bulldog",
  "bulldog-french": "French Bulldog",

  // Bull Terriers
  "bullterrier-staffordshire": "Staffordshire Bull Terrier",

  // C
  "cattledog-australian": "Australian Cattle Dog",
  cavapoo: "Cavapoo",
  chihuahua: "Chihuahua",
  "chippiparai-indian": "Chippiparai",
  chow: "Chow Chow",
  clumber: "Clumber Spaniel",
  cockapoo: "Cockapoo",

  // Collies
  collie: "Collie",
  "collie-border": "Border Collie",

  coonhound: "Coonhound",

  // Corgis
  corgi: "Corgi",
  "corgi-cardigan": "Cardigan Welsh Corgi",

  cotondetulear: "Coton de Tuléar",

  // D
  dachshund: "Dachshund",
  dalmatian: "Dalmatian",
  "dane-great": "Great Dane",
  "deerhound-scottish": "Scottish Deerhound",
  dhole: "Dhole",
  dingo: "Dingo",
  doberman: "Doberman Pinscher",

  // E
  "elkhound-norwegian": "Norwegian Elkhound",
  entlebucher: "Entlebucher Mountain Dog",
  eskimo: "American Eskimo Dog",

  // F
  "finnish-lapphund": "Finnish Lapphund",
  "frise-bichon": "Bichon Frise",

  // G
  "gaddi-indian": "Gaddi Kutta",
  "german-shepherd": "German Shepherd",

  // Greyhounds
  greyhound: "Greyhound",
  "greyhound-indian": "Indian Greyhound",
  "greyhound-italian": "Italian Greyhound",

  groenendael: "Belgian Groenendael",

  // H
  havanese: "Havanese",

  // Hounds
  "hound-afghan": "Afghan Hound",
  "hound-basset": "Basset Hound",
  "hound-blood": "Bloodhound",
  "hound-english": "English Foxhound",
  "hound-ibizan": "Ibizan Hound",
  "hound-plott": "Plott Hound",
  "hound-walker": "Treeing Walker Coonhound",

  husky: "Siberian Husky",

  // K
  keeshond: "Keeshond",
  kelpie: "Kelpie",
  kombai: "Kombai",
  komondor: "Komondor",
  kuvasz: "Kuvasz",

  // L
  labradoodle: "Labradoodle",
  labrador: "Labrador Retriever",
  leonberg: "Leonberger",
  lhasa: "Lhasa Apso",

  // M
  malamute: "Alaskan Malamute",
  malinois: "Belgian Malinois",
  maltese: "Maltese",

  // Mastiffs
  "mastiff-bull": "Bullmastiff",
  "mastiff-english": "English Mastiff",
  "mastiff-indian": "Indian Mastiff",
  "mastiff-tibetan": "Tibetan Mastiff",

  mexicanhairless: "Mexican Hairless Dog (Xoloitzcuintli)",
  mix: "Mixed Breed",

  // Mountain dogs
  "mountain-bernese": "Bernese Mountain Dog",
  "mountain-swiss": "Greater Swiss Mountain Dog",

  "mudhol-indian": "Mudhol Hound",

  // N
  newfoundland: "Newfoundland",

  // O
  otterhound: "Otterhound",
  "ovcharka-caucasian": "Caucasian Shepherd Dog",

  // P
  papillon: "Papillon",
  "pariah-indian": "Indian Pariah Dog",
  pekinese: "Pekingese",
  pembroke: "Pembroke Welsh Corgi",

  // Pinschers
  pinscher: "Pinscher",
  "pinscher-miniature": "Miniature Pinscher",

  pitbull: "American Pit Bull Terrier",

  // Pointers
  "pointer-german": "German Shorthaired Pointer",
  "pointer-germanlonghair": "German Longhaired Pointer",

  pomeranian: "Pomeranian",

  // Poodles
  "poodle-medium": "Medium Poodle",
  "poodle-miniature": "Miniature Poodle",
  "poodle-standard": "Standard Poodle",
  "poodle-toy": "Toy Poodle",

  pug: "Pug",
  puggle: "Puggle",
  pyrenees: "Great Pyrenees",

  // R
  "rajapalayam-indian": "Rajapalayam",
  redbone: "Redbone Coonhound",

  // Retrievers
  "retriever-chesapeake": "Chesapeake Bay Retriever",
  "retriever-curly": "Curly-Coated Retriever",
  "retriever-flatcoated": "Flat-Coated Retriever",
  "retriever-golden": "Golden Retriever",

  "ridgeback-rhodesian": "Rhodesian Ridgeback",
  rottweiler: "Rottweiler",
  "rough-collie": "Rough Collie",

  // S
  saluki: "Saluki",
  samoyed: "Samoyed",
  schipperke: "Schipperke",

  // Schnauzers
  schnauzer: "Schnauzer",
  "schnauzer-giant": "Giant Schnauzer",
  "schnauzer-miniature": "Miniature Schnauzer",

  "segugio-italian": "Segugio Italiano",

  // Setters
  "setter-english": "English Setter",
  "setter-gordon": "Gordon Setter",
  "setter-irish": "Irish Setter",

  sharpei: "Shar Pei",

  // Sheepdogs
  "sheepdog-english": "Old English Sheepdog",
  "sheepdog-indian": "Himalayan Sheepdog",
  "sheepdog-shetland": "Shetland Sheepdog",

  shiba: "Shiba Inu",
  shihtzu: "Shih Tzu",

  // Spaniels
  "spaniel-blenheim": "Blenheim Spaniel",
  "spaniel-brittany": "Brittany Spaniel",
  "spaniel-cocker": "Cocker Spaniel",
  "spaniel-irish": "Irish Water Spaniel",
  "spaniel-japanese": "Japanese Chin",
  "spaniel-sussex": "Sussex Spaniel",
  "spaniel-welsh": "Welsh Springer Spaniel",

  // Spitz
  "spitz-indian": "Indian Spitz",
  "spitz-japanese": "Japanese Spitz",

  "springer-english": "English Springer Spaniel",
  stbernard: "St. Bernard",

  // Terriers
  "terrier-american": "American Staffordshire Terrier",
  "terrier-andalusian": "Andalusian Terrier",
  "terrier-australian": "Australian Terrier",
  "terrier-bedlington": "Bedlington Terrier",
  "terrier-border": "Border Terrier",
  "terrier-boston": "Boston Terrier",
  "terrier-cairn": "Cairn Terrier",
  "terrier-dandie": "Dandie Dinmont Terrier",
  "terrier-fox": "Fox Terrier",
  "terrier-irish": "Irish Terrier",
  "terrier-kerryblue": "Kerry Blue Terrier",
  "terrier-lakeland": "Lakeland Terrier",
  "terrier-norfolk": "Norfolk Terrier",
  "terrier-norwich": "Norwich Terrier",
  "terrier-patterdale": "Patterdale Terrier",
  "terrier-russell": "Jack Russell Terrier",
  "terrier-scottish": "Scottish Terrier",
  "terrier-sealyham": "Sealyham Terrier",
  "terrier-silky": "Silky Terrier",
  "terrier-tibetan": "Tibetan Terrier",
  "terrier-toy": "Toy Fox Terrier",
  "terrier-welsh": "Welsh Terrier",
  "terrier-westhighland": "West Highland White Terrier",
  "terrier-wheaten": "Soft-Coated Wheaten Terrier",
  "terrier-yorkshire": "Yorkshire Terrier",

  tervuren: "Belgian Tervuren",

  // V
  vizsla: "Vizsla",

  // W
  "waterdog-spanish": "Spanish Water Dog",
  weimaraner: "Weimaraner",
  whippet: "Whippet",
  "wolfhound-irish": "Irish Wolfhound",
} as const;

/**
 * Get human-readable breed name from Dog CEO breed key
 *
 * @param breedKey - Dog CEO breed key (e.g., "retriever-golden", "beagle")
 * @returns Human-readable breed name
 *
 * @example
 * getReadableBreedName("retriever-golden") // "Golden Retriever"
 * getReadableBreedName("beagle") // "Beagle"
 * getReadableBreedName("unknown-breed") // "Unknown Breed"
 */
export function getReadableBreedName(breedKey: string): string {
  if (!breedKey || typeof breedKey !== "string") {
    return "Unknown Breed";
  }

  const normalized = breedKey.toLowerCase().trim();
  const mapped = DOG_CEO_BREED_MAP[normalized];

  if (mapped) {
    return mapped;
  }

  // Fallback: Convert hyphenated format to title case
  // "some-unknown-breed" -> "Some Unknown Breed"
  return normalized
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Get URL-safe slug from Dog CEO breed key
 *
 * @param breedKey - Dog CEO breed key (e.g., "retriever-golden")
 * @returns URL-safe slug (e.g., "retriever-golden")
 *
 * @example
 * getBreedSlug("retriever-golden") // "retriever-golden"
 * getBreedSlug("BEAGLE") // "beagle"
 */
export function getBreedSlug(breedKey: string): string {
  if (!breedKey || typeof breedKey !== "string") {
    return "unknown";
  }

  return breedKey.toLowerCase().trim().replace(/\s+/g, "-");
}

/**
 * Get Dog CEO API path from breed key
 *
 * @param breedKey - Dog CEO breed key (e.g., "retriever-golden")
 * @returns API path format (e.g., "retriever/golden")
 *
 * @example
 * getApiPath("retriever-golden") // "retriever/golden"
 * getApiPath("beagle") // "beagle"
 */
export function getApiPath(breedKey: string): string {
  if (!breedKey || typeof breedKey !== "string") {
    return "";
  }

  const normalized = breedKey.toLowerCase().trim();
  return normalized.includes("-") ? normalized.replace("-", "/") : normalized;
}

/**
 * Check if a breed key is valid (exists in our mapping)
 *
 * @param breedKey - Dog CEO breed key to validate
 * @returns true if the breed is known
 */
export function isKnownBreed(breedKey: string): boolean {
  if (!breedKey || typeof breedKey !== "string") {
    return false;
  }

  return breedKey.toLowerCase().trim() in DOG_CEO_BREED_MAP;
}

/**
 * Get all breed keys
 *
 * @returns Array of all known breed keys
 */
export function getAllBreedKeys(): string[] {
  return Object.keys(DOG_CEO_BREED_MAP);
}

/**
 * Get all breed entries as [key, name] pairs
 *
 * @returns Array of [breedKey, readableName] tuples
 */
export function getAllBreeds(): [string, string][] {
  return Object.entries(DOG_CEO_BREED_MAP);
}

/**
 * Search breeds by name (case-insensitive partial match)
 *
 * @param query - Search query
 * @returns Array of matching [breedKey, readableName] tuples
 *
 * @example
 * searchBreeds("terrier") // Returns all terrier breeds
 * searchBreeds("golden") // Returns ["retriever-golden", "Golden Retriever"]
 */
export function searchBreeds(query: string): [string, string][] {
  if (!query || typeof query !== "string") {
    return [];
  }

  const lowerQuery = query.toLowerCase().trim();

  return Object.entries(DOG_CEO_BREED_MAP).filter(
    ([key, name]) =>
      key.includes(lowerQuery) || name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get breed count
 *
 * @returns Total number of breeds in the mapping
 */
export function getBreedCount(): number {
  return Object.keys(DOG_CEO_BREED_MAP).length;
}
