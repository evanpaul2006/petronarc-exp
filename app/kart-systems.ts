export type SystemId =
  | "brake"
  | "chassis"
  | "steering"
  | "suspension"
  | "wheels"
  | "electrical"
  | "engine"
  | "seat"
  | "safety"
  | "assembly";

export type IconKey = SystemId;

export interface ExpenseImage {
  /** A link to the image (typically a Google Drive share link), not embedded data. */
  url: string;
  name?: string;
}

export interface ExpenseItem {
  id: string;
  systemId: SystemId;
  name: string;
  quantity: number;
  unitPriceInr: number;
  totalPriceInr: number;
  description?: string;
  images?: ExpenseImage[];
  date: string;
  vendor?: string;
  createdAt: number;
}

export interface SystemExpenseSummary {
  systemId: SystemId;
  totalCostInr: number;
  componentCount: number;
  items: ExpenseItem[];
}

export interface KartSystem {
  id: SystemId;
  name: string;
  shortName: string;
  description: string;
  aliases: string[];
  icon: IconKey;
  /** Primary [0] and secondary 3D candidate vectors. Empty = no hotspot on the 3D canvas. */
  anchors3D: Array<[number, number, number]>;
  cameraOffset: [number, number, number];    // Model-space offset vector for camera focus
}

export const KART_SYSTEMS: KartSystem[] = [
  {
    id: "brake",
    name: "Brake System",
    shortName: "Brakes",
    description:
      "Hydraulic braking architecture engineered for consistent pedal feel, short stopping distance and dependable heat management.",
    aliases: ["disc", "caliper", "pedal", "master cylinder", "brake lines", "rotor", "pads"],
    icon: "brake",
    anchors3D: [
      [0.292, -0.10, -0.38],
      [0.292, -0.12, -0.34],
    ],
    cameraOffset: [0.6, 0.4, 0.8],
  },
  {
    id: "chassis",
    name: "Chassis",
    shortName: "Chassis",
    description:
      "A triangulated tubular spaceframe that balances torsional rigidity, driver protection and serviceable packaging.",
    aliases: ["frame", "spaceframe", "tubes", "structure", "welding", "floor pan", "tabs"],
    icon: "chassis",
    anchors3D: [
      [-0.338, 0.365, 0.007],
      [-0.338, 0.35, 0.0],
    ],
    cameraOffset: [0.7, 0.5, 0.6],
  },
  {
    id: "steering",
    name: "Steering System",
    shortName: "Steering",
    description:
      "A compact rack-and-pinion layout tuned for precise turn-in, controlled feedback and low steering effort.",
    aliases: ["rack", "pinion", "column", "tie rod", "wheel", "rod ends", "u-joint"],
    icon: "steering",
    anchors3D: [
      [0.06, -0.08, -0.02],
      [0.08, -0.10, 0.00],
    ],
    cameraOffset: [0.4, 0.6, 0.6],
  },
  {
    id: "suspension",
    name: "Suspension",
    shortName: "Suspension",
    description:
      "Adjustable double-wishbone suspension that keeps the contact patch composed across braking, cornering and uneven surfaces.",
    aliases: ["shock", "damper", "wishbone", "a arm", "upright", "spring", "bearing", "shim"],
    icon: "suspension",
    anchors3D: [
      [-0.62, -0.10, -0.38],
      [-0.62, -0.12, -0.40],
    ],
    cameraOffset: [0.7, 0.5, -0.7],
  },
  {
    id: "wheels",
    name: "Wheels & Tires",
    shortName: "Wheels & Tires",
    description:
      "Lightweight wheels and competition tires selected to maximize mechanical grip while minimizing unsprung mass.",
    aliases: ["tyres", "rims", "rubber", "hub", "wheel", "studs", "lug nuts"],
    icon: "wheels",
    anchors3D: [
      [0.308, -0.10, 0.536],
      [0.308, -0.10, -0.536],
      [0.308, -0.08, 0.48],
    ],
    cameraOffset: [-0.6, 0.4, 0.8],
  },
  {
    id: "electrical",
    name: "Electrical System",
    shortName: "Electrical",
    description:
      "A compact low-voltage network handling power distribution, sensing, data acquisition and driver controls.",
    aliases: ["wiring", "battery", "ecu", "sensor", "data", "loom", "fuses", "kill switch", "dash"],
    icon: "electrical",
    anchors3D: [
      [-0.55, -0.15, 0.18],
      [-0.55, -0.18, 0.15],
    ],
    cameraOffset: [-0.4, 0.5, 0.7],
  },
  {
    id: "engine",
    name: "Engine & Radiator",
    shortName: "Engine & Radiator",
    description:
      "The powertrain and cooling package combines responsive output with controlled operating temperatures and rapid service access.",
    aliases: ["motor", "radiator", "cooling", "powertrain", "drivetrain", "intake", "exhaust", "clutch", "chain"],
    icon: "engine",
    anchors3D: [
      [-0.595, 0.032, -0.02],
      [-0.595, 0.032, -0.04],
    ],
    cameraOffset: [-0.8, 0.6, 0.5],
  },
  {
    id: "seat",
    name: "Seat & Firewall",
    shortName: "Seat & Firewall",
    description:
      "A driver-fit seat, harness geometry and insulated firewall designed around control, comfort and cockpit separation.",
    aliases: ["driver", "cockpit", "harness", "bulkhead", "ergonomics", "padding", "belts"],
    icon: "seat",
    anchors3D: [
      [-0.26, 0.01, 0.00],
      [-0.24, 0.03, -0.05],
    ],
    cameraOffset: [0.2, 0.6, 0.7],
  },
  {
    id: "safety",
    name: "Safety Gears",
    shortName: "Safety",
    description:
      "Driver protective equipment — certified helmet, fire-resistant suit, rib protection, gloves and boots that keep the crew inside the rulebook and out of harm.",
    aliases: [
      "helmet",
      "suit",
      "gloves",
      "rib protector",
      "boots",
      "balaclava",
      "neck brace",
      "fire extinguisher",
      "driver gear",
      "ppe",
    ],
    icon: "safety",
    anchors3D: [],
    cameraOffset: [0, 0, 0],
  },
  {
    id: "assembly",
    name: "Misc. finish & Assembly",
    shortName: "Assembly & Finish",
    description:
      "Everything that turns parts into a car — hardware and fasteners, bracket fabrication, powder coating, paint, decals and the consumables burned during assembly.",
    aliases: [
      "hardware",
      "bolts",
      "nuts",
      "fasteners",
      "brackets",
      "fabrication",
      "powder coating",
      "paint",
      "decals",
      "livery",
      "consumables",
      "adhesive",
    ],
    icon: "assembly",
    anchors3D: [],
    cameraOffset: [0, 0, 0],
  },
];

/** Systems that have anchors on the 3D model. Non-physical systems (safety, assembly) are excluded. */
export const MARKER_SYSTEMS: KartSystem[] = KART_SYSTEMS.filter(
  (system) => system.anchors3D.length > 0,
);

export function getSystemById(id: SystemId): KartSystem {
  return KART_SYSTEMS.find((system) => system.id === id) ?? KART_SYSTEMS[0];
}

export function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Sample starter data that users can optionally load for demo purposes */
export const SAMPLE_EXPENSES: Omit<ExpenseItem, "id" | "createdAt">[] = [
  {
    systemId: "brake",
    name: "Front Dual-Piston Brake Caliper Pair",
    quantity: 2,
    unitPriceInr: 12500,
    totalPriceInr: 25000,
    description: "Forged aluminum floating calipers with high-temp ceramic seals and quick-bleed ports.",
    vendor: "Brembo Motorsport",
    date: "2026-02-10",
  },
  {
    systemId: "brake",
    name: "Laser-Slotted 200mm Stainless Rotors",
    quantity: 4,
    unitPriceInr: 3200,
    totalPriceInr: 12800,
    description: "Heat-treated 410 stainless steel rotors with directional venting slots.",
    vendor: "EBC Brakes",
    date: "2026-02-14",
  },
  {
    systemId: "chassis",
    name: "Chromoly 4130 Seamless Tubing Bundle",
    quantity: 14,
    unitPriceInr: 4500,
    totalPriceInr: 63000,
    description: "1.25-inch OD x 0.095 wall thickness normalized 4130 chromoly tubes for main roll hoop and front bulkhead.",
    vendor: "Apex Precision Tubes",
    date: "2026-01-20",
  },
  {
    systemId: "engine",
    name: "High-Efficiency Aluminum Core Radiator",
    quantity: 1,
    unitPriceInr: 18500,
    totalPriceInr: 18500,
    description: "Dual-pass crossflow aluminum radiator with silicone hoses and 12V high-RPM puller fan.",
    vendor: "Mishimoto Performance",
    date: "2026-02-05",
  },
  {
    systemId: "safety",
    name: "SA2020 Composite Racing Helmet",
    quantity: 2,
    unitPriceInr: 21500,
    totalPriceInr: 43000,
    description: "Snell SA2020 certified composite shell helmet with M6 terminal mounts and fire-retardant liner.",
    vendor: "Bell Racing",
    date: "2026-02-18",
  },
  {
    systemId: "assembly",
    name: "Grade 8.8 Fastener & Hardware Kit",
    quantity: 1,
    unitPriceInr: 9600,
    totalPriceInr: 9600,
    description: "Full-vehicle metric fastener kit — bolts, nyloc nuts, washers and thread locker for final assembly.",
    vendor: "Unbrako India",
    date: "2026-02-22",
  },
];
