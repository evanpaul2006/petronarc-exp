export type SystemId =
  | "brake"
  | "chassis"
  | "steering"
  | "suspension"
  | "wheels"
  | "electrical"
  | "engine"
  | "seat";

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
  anchors3D: Array<[number, number, number]>; // Primary [0] and secondary 3D candidate vectors
  cameraOffset: [number, number, number];    // Model-space offset vector for camera focus
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
    // Representative front brake hub / caliper location elevated above wheel mesh.
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
    // Measured steering rack & column assembly moved further forward and down.
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
    // Representative rear-left suspension & coilover assembly.
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
    // Measured elevated tire shoulder / tread surface location.
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
    // Measured rear powertrain surface slightly offset left.
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
    // Measured visible seat shell surface brought slightly forward.
    anchors3D: [
      [-0.26, 0.01, 0.00],
      [-0.24, 0.03, -0.05],
    ],
    cameraOffset: [0.2, 0.6, 0.7],
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
