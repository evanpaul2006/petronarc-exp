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
  | "misc";

export type IconKey = SystemId;

export interface KeyComponent {
  name: string;
  quantity: number;
}

export interface KartSystem {
  id: SystemId;
  name: string;
  shortName: string;
  componentCount: number;
  estimatedCostInr: number;
  description: string;
  aliases: string[];
  keyComponents: KeyComponent[];
  icon: IconKey;
  hotspot: { x: number; y: number; align: "left" | "right" };
}

export const KART_SYSTEMS: KartSystem[] = [
  {
    id: "brake",
    name: "Brake System",
    shortName: "Brakes",
    componentCount: 12,
    estimatedCostInr: 48_500,
    description:
      "Hydraulic braking architecture engineered for consistent pedal feel, short stopping distance and dependable heat management.",
    aliases: ["disc", "caliper", "pedal", "master cylinder", "brake lines"],
    keyComponents: [
      { name: "Front Disc Brake", quantity: 2 },
      { name: "Rear Disc Brake", quantity: 2 },
      { name: "Master Cylinder", quantity: 1 },
      { name: "Brake Calipers", quantity: 4 },
      { name: "Brake Lines", quantity: 6 },
      { name: "Pedal Box", quantity: 1 },
    ],
    icon: "brake",
    hotspot: { x: 31, y: 64, align: "right" },
  },
  {
    id: "chassis",
    name: "Chassis",
    shortName: "Chassis",
    componentCount: 18,
    estimatedCostInr: 125_000,
    description:
      "A triangulated tubular spaceframe that balances torsional rigidity, driver protection and serviceable packaging.",
    aliases: ["frame", "spaceframe", "tubes", "structure", "welding"],
    keyComponents: [
      { name: "Primary Frame Tubes", quantity: 14 },
      { name: "Cross Members", quantity: 8 },
      { name: "Mounting Tabs", quantity: 22 },
      { name: "Floor Pan", quantity: 1 },
      { name: "Nose Supports", quantity: 4 },
      { name: "Fastener Sets", quantity: 10 },
    ],
    icon: "chassis",
    hotspot: { x: 59, y: 42, align: "left" },
  },
  {
    id: "steering",
    name: "Steering System",
    shortName: "Steering",
    componentCount: 8,
    estimatedCostInr: 38_000,
    description:
      "A compact rack-and-pinion layout tuned for precise turn-in, controlled feedback and low steering effort.",
    aliases: ["rack", "pinion", "column", "tie rod", "wheel"],
    keyComponents: [
      { name: "Steering Wheel", quantity: 1 },
      { name: "Steering Column", quantity: 1 },
      { name: "Universal Joints", quantity: 2 },
      { name: "Rack & Pinion", quantity: 1 },
      { name: "Tie Rods", quantity: 2 },
      { name: "Rod Ends", quantity: 4 },
    ],
    icon: "steering",
    hotspot: { x: 42, y: 48, align: "left" },
  },
  {
    id: "suspension",
    name: "Suspension",
    shortName: "Suspension",
    componentCount: 24,
    estimatedCostInr: 92_000,
    description:
      "Adjustable double-wishbone suspension that keeps the contact patch composed across braking, cornering and uneven surfaces.",
    aliases: ["shock", "damper", "wishbone", "a arm", "upright", "spring"],
    keyComponents: [
      { name: "Coilover Dampers", quantity: 4 },
      { name: "Upper Wishbones", quantity: 4 },
      { name: "Lower Wishbones", quantity: 4 },
      { name: "Uprights", quantity: 4 },
      { name: "Spherical Bearings", quantity: 16 },
      { name: "Adjustment Shims", quantity: 12 },
    ],
    icon: "suspension",
    hotspot: { x: 49, y: 72, align: "left" },
  },
  {
    id: "wheels",
    name: "Wheels & Tires",
    shortName: "Wheels & Tires",
    componentCount: 12,
    estimatedCostInr: 72_000,
    description:
      "Lightweight wheels and competition tires selected to maximize mechanical grip while minimizing unsprung mass.",
    aliases: ["tyres", "rims", "rubber", "hub", "wheel"],
    keyComponents: [
      { name: "Front Wheels", quantity: 2 },
      { name: "Rear Wheels", quantity: 2 },
      { name: "Dry Tires", quantity: 4 },
      { name: "Wet Tires", quantity: 4 },
      { name: "Wheel Hubs", quantity: 4 },
      { name: "Wheel Nuts", quantity: 4 },
    ],
    icon: "wheels",
    hotspot: { x: 78, y: 68, align: "left" },
  },
  {
    id: "electrical",
    name: "Electrical System",
    shortName: "Electrical",
    componentCount: 16,
    estimatedCostInr: 45_000,
    description:
      "A compact low-voltage network handling power distribution, sensing, data acquisition and driver controls.",
    aliases: ["wiring", "battery", "ecu", "sensor", "data", "loom"],
    keyComponents: [
      { name: "Wiring Harness", quantity: 1 },
      { name: "12V Battery", quantity: 1 },
      { name: "Main Control Unit", quantity: 1 },
      { name: "Sensor Suite", quantity: 8 },
      { name: "Dash Display", quantity: 1 },
      { name: "Fuse & Relay Box", quantity: 1 },
    ],
    icon: "electrical",
    hotspot: { x: 80, y: 53, align: "right" },
  },
  {
    id: "engine",
    name: "Engine & Radiator",
    shortName: "Engine & Radiator",
    componentCount: 14,
    estimatedCostInr: 185_000,
    description:
      "The powertrain and cooling package combines responsive output with controlled operating temperatures and rapid service access.",
    aliases: ["motor", "radiator", "cooling", "powertrain", "drivetrain", "intake"],
    keyComponents: [
      { name: "Engine Assembly", quantity: 1 },
      { name: "Radiator", quantity: 1 },
      { name: "Cooling Fan", quantity: 1 },
      { name: "Coolant Lines", quantity: 4 },
      { name: "Intake Assembly", quantity: 1 },
      { name: "Drive Components", quantity: 6 },
    ],
    icon: "engine",
    hotspot: { x: 83, y: 38, align: "left" },
  },
  {
    id: "seat",
    name: "Seat & Firewall",
    shortName: "Seat & Firewall",
    componentCount: 7,
    estimatedCostInr: 34_000,
    description:
      "A driver-fit seat, harness geometry and insulated firewall designed around control, comfort and cockpit separation.",
    aliases: ["driver", "cockpit", "harness", "bulkhead", "ergonomics"],
    keyComponents: [
      { name: "Composite Seat", quantity: 1 },
      { name: "Six-Point Harness", quantity: 1 },
      { name: "Firewall Panel", quantity: 1 },
      { name: "Seat Mounts", quantity: 4 },
      { name: "Head Restraint", quantity: 1 },
      { name: "Thermal Insulation", quantity: 2 },
    ],
    icon: "seat",
    hotspot: { x: 62, y: 31, align: "right" },
  },
  {
    id: "safety",
    name: "Safety Gear",
    shortName: "Safety Gear",
    componentCount: 10,
    estimatedCostInr: 58_000,
    description:
      "Competition-grade driver protection covering impact, fire resistance, restraint and emergency response requirements.",
    aliases: ["helmet", "suit", "gloves", "extinguisher", "protection", "roll hoop"],
    keyComponents: [
      { name: "Driver Helmet", quantity: 1 },
      { name: "Fireproof Suit", quantity: 1 },
      { name: "Gloves & Shoes", quantity: 2 },
      { name: "Neck Restraint", quantity: 1 },
      { name: "Fire Extinguisher", quantity: 1 },
      { name: "Emergency Cut-Off", quantity: 2 },
    ],
    icon: "safety",
    hotspot: { x: 58, y: 17, align: "right" },
  },
  {
    id: "misc",
    name: "Misc. Finish & Assembly",
    shortName: "Finish & Assembly",
    componentCount: 15,
    estimatedCostInr: 67_500,
    description:
      "Fabrication consumables, fasteners, surface finishing and final integration work that turn individual systems into a finished kart.",
    aliases: ["paint", "fasteners", "fabrication", "labour", "assembly", "consumables"],
    keyComponents: [
      { name: "Fastener Inventory", quantity: 1 },
      { name: "Powder Coating", quantity: 1 },
      { name: "Body Panels", quantity: 3 },
      { name: "Fabrication Supplies", quantity: 1 },
      { name: "Workshop Consumables", quantity: 1 },
      { name: "Final Alignment", quantity: 1 },
    ],
    icon: "misc",
    hotspot: { x: 21, y: 78, align: "right" },
  },
];

export const TOTAL_ESTIMATED_COST = KART_SYSTEMS.reduce(
  (total, system) => total + system.estimatedCostInr,
  0,
);

export const TOTAL_COMPONENTS = KART_SYSTEMS.reduce(
  (total, system) => total + system.componentCount,
  0,
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
