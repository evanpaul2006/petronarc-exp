import * as THREE from "three";

export type EnvironmentThemeId = "cyber" | "studio";

export interface EnvironmentThemeConfig {
  id: EnvironmentThemeId;
  name: string;
  shortName: string;
  description: string;
  badgeLabel: string;
  
  // Three.js Floor & Lighting Settings
  floorColor: number;
  shadowColor: number;
  shadowOpacity: number;
  floorSize: number;
  
  hemiSkyColor: number;
  hemiGroundColor: number;
  hemiIntensity: number;
  
  keyLightColor: number;
  keyLightIntensity: number;
  keyLightPos: [number, number, number];
  
  rimLightColor: number;
  rimLightIntensity: number;
  rimLightPos: [number, number, number];
  
  fillLightColor: number;
  fillLightIntensity: number;
  fillLightPos: [number, number, number];

  toneMappingExposure: number;
}

export const ENVIRONMENT_THEMES: Record<EnvironmentThemeId, EnvironmentThemeConfig> = {
  cyber: {
    id: "cyber",
    name: "Cyber Paddock",
    shortName: "CYBER",
    description: "High-tech dark telemetry stage with neon grid overlays and directional rim lights",
    badgeLabel: "CYBER PADDOCK",
    
    floorColor: 0x000a0e,
    shadowColor: 0x000a0e,
    shadowOpacity: 0.42,
    floorSize: 4.2,
    
    hemiSkyColor: 0xc9f9ff,
    hemiGroundColor: 0x041117,
    hemiIntensity: 2.25,
    
    keyLightColor: 0xffffff,
    keyLightIntensity: 4.4,
    keyLightPos: [-2.8, 4.5, 3.4],
    
    rimLightColor: 0x18e4f2,
    rimLightIntensity: 3.2,
    rimLightPos: [3.5, 1.8, -2.2],
    
    fillLightColor: 0x5b91ff,
    fillLightIntensity: 1.1,
    fillLightPos: [-3, 0.4, -2.6],

    toneMappingExposure: 1.05,
  },
  studio: {
    id: "studio",
    name: "Clean Studio",
    shortName: "STUDIO",
    description: "Pristine white showroom backdrop with soft contact shadows and balanced studio lighting",
    badgeLabel: "CLEAN STUDIO",
    
    floorColor: 0xdde5ec,
    shadowColor: 0x1a2632,
    shadowOpacity: 0.28,
    floorSize: 5.5,
    
    hemiSkyColor: 0xffffff,
    hemiGroundColor: 0x90a4ae,
    hemiIntensity: 1.85,
    
    keyLightColor: 0xfffcf7,
    keyLightIntensity: 3.8,
    keyLightPos: [-2.5, 4.8, 3.2],
    
    rimLightColor: 0xdbeafe,
    rimLightIntensity: 2.1,
    rimLightPos: [3.2, 2.0, -2.0],
    
    fillLightColor: 0xe2e8f0,
    fillLightIntensity: 1.6,
    fillLightPos: [-3.2, 0.8, -2.2],

    toneMappingExposure: 1.0,
  },
};
