import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  type AnchorSelectionState,
  calculateCandidateScore,
  calculateEdgeClearance,
  isPointVisibleInFrustum,
  updateAnchorSelection,
} from "./kart-marker-math";

describe("kart-marker-math", () => {
  describe("isPointVisibleInFrustum", () => {
    it("returns true for point within NDC [-1, 1] and camera Z < 0", () => {
      const ndc = new THREE.Vector3(0, 0, 0.5);
      expect(isPointVisibleInFrustum(ndc, -2)).toBe(true);
    });

    it("returns false if camera Z >= 0 (behind camera)", () => {
      const ndc = new THREE.Vector3(0, 0, 0.5);
      expect(isPointVisibleInFrustum(ndc, 0.5)).toBe(false);
    });

    it("returns false if NDC X or Y is outside [-1, 1]", () => {
      expect(isPointVisibleInFrustum(new THREE.Vector3(1.2, 0, 0), -2)).toBe(false);
      expect(isPointVisibleInFrustum(new THREE.Vector3(0, -1.5, 0), -2)).toBe(false);
    });
  });

  describe("calculateEdgeClearance", () => {
    it("returns 1 for center of viewport (NDC 0, 0)", () => {
      expect(calculateEdgeClearance(new THREE.Vector3(0, 0, 0))).toBe(1);
    });

    it("returns 0 at viewport boundary (NDC 1, 0)", () => {
      expect(calculateEdgeClearance(new THREE.Vector3(1, 0, 0))).toBe(0);
    });

    it("returns correct clearance for quarter position (NDC 0.5, 0.2)", () => {
      expect(calculateEdgeClearance(new THREE.Vector3(0.5, 0.2, 0))).toBe(0.5);
    });
  });

  describe("calculateCandidateScore", () => {
    it("penalizes occluded candidates heavily", () => {
      const unoccludedScore = calculateCandidateScore(false, 0.8, 2.0);
      const occludedScore = calculateCandidateScore(true, 0.8, 2.0);
      expect(occludedScore).toBe(unoccludedScore - 100);
    });
  });

  describe("updateAnchorSelection", () => {
    it("switches immediately if current active anchor is not visible", () => {
      const initial = { activeIndex: 0, challengerIndex: null, challengerFrames: 0 };
      const candidates = [
        { isVisible: false, score: 80 },
        { isVisible: true, score: 50 },
      ];

      const result = updateAnchorSelection(initial, candidates);
      expect(result.activeIndex).toBe(1);
      expect(result.challengerFrames).toBe(0);
    });

    it("maintains current anchor if max score is not exceeding by 15 points", () => {
      const initial = { activeIndex: 0, challengerIndex: null, challengerFrames: 0 };
      const candidates = [
        { isVisible: true, score: 50 },
        { isVisible: true, score: 60 }, // Difference is 10 (< 15)
      ];

      const result = updateAnchorSelection(initial, candidates);
      expect(result.activeIndex).toBe(0);
      expect(result.challengerIndex).toBe(null);
    });

    it("requires 3 consecutive frames to switch to a higher score challenger (> 15 diff)", () => {
      let state: AnchorSelectionState = { activeIndex: 0, challengerIndex: null, challengerFrames: 0 };
      const candidates = [
        { isVisible: true, score: 30 },
        { isVisible: true, score: 60 }, // Difference is 30 (> 15)
      ];

      // Frame 1
      state = updateAnchorSelection(state, candidates);
      expect(state.activeIndex).toBe(0);
      expect(state.challengerIndex).toBe(1);
      expect(state.challengerFrames).toBe(1);

      // Frame 2
      state = updateAnchorSelection(state, candidates);
      expect(state.activeIndex).toBe(0);
      expect(state.challengerIndex).toBe(1);
      expect(state.challengerFrames).toBe(2);

      // Frame 3 - switches active index!
      state = updateAnchorSelection(state, candidates);
      expect(state.activeIndex).toBe(1);
      expect(state.challengerIndex).toBe(null);
      expect(state.challengerFrames).toBe(0);
    });

    it("handles all-hidden candidates safely without crashing or selecting bad index", () => {
      const initial = { activeIndex: 0, challengerIndex: null, challengerFrames: 0 };
      const candidates = [
        { isVisible: false, score: -100 },
        { isVisible: false, score: -120 },
      ];

      const result = updateAnchorSelection(initial, candidates);
      expect(result.activeIndex).toBe(0);
      expect(result.challengerIndex).toBe(null);
    });
  });
});
