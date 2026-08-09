import type * as THREE from "three";

export type AnchorSelectionState = {
  activeIndex: number;
  challengerIndex: number | null;
  challengerFrames: number;
};

/**
 * Checks if a point in Normalized Device Coordinates (NDC) and camera space Z is visible
 * within the camera view frustum and in front of the camera plane.
 */
export function isPointVisibleInFrustum(ndc: THREE.Vector3, cameraZ: number): boolean {
  if (cameraZ >= 0) return false; // Behind camera
  return (
    ndc.x >= -1 &&
    ndc.x <= 1 &&
    ndc.y >= -1 &&
    ndc.y <= 1 &&
    ndc.z >= -1 &&
    ndc.z <= 1
  );
}

/**
 * Calculates edge clearance (distance from closest viewport boundary in NDC space).
 * Returns a value between 0 (at edge) and 1 (at center).
 */
export function calculateEdgeClearance(ndc: THREE.Vector3): number {
  return Math.max(0, Math.min(1 - Math.abs(ndc.x), 1 - Math.abs(ndc.y)));
}

/**
 * Calculates candidate score for multi-anchor selection.
 * Higher score is preferred. Occluded points receive a major penalty (-100).
 */
export function calculateCandidateScore(
  isOccluded: boolean,
  edgeClearance: number,
  cameraDistance: number,
): number {
  const visibilityTier = isOccluded ? -100 : 0;
  return visibilityTier + edgeClearance * 50 - cameraDistance * 2;
}

/**
 * State machine for multi-anchor candidate selection with 3-frame 15-point hysteresis.
 * Immediately switches if active anchor is hidden/invalid.
 */
export function updateAnchorSelection(
  state: AnchorSelectionState,
  candidates: Array<{ isVisible: boolean; score: number }>,
): AnchorSelectionState {
  if (candidates.length === 0) return state;

  // Immediate switch if current active anchor is invalid / hidden
  if (!candidates[state.activeIndex]?.isVisible) {
    let bestIndex = 0;
    let maxScore = -Infinity;
    candidates.forEach((c, idx) => {
      if (c.isVisible && c.score > maxScore) {
        maxScore = c.score;
        bestIndex = idx;
      }
    });

    if (maxScore === -Infinity) {
      return { ...state, challengerIndex: null, challengerFrames: 0 };
    }

    return { activeIndex: bestIndex, challengerIndex: null, challengerFrames: 0 };
  }

  // Find best overall candidate
  let bestIndex = 0;
  let maxScore = -Infinity;
  candidates.forEach((c, idx) => {
    if (c.isVisible && c.score > maxScore) {
      maxScore = c.score;
      bestIndex = idx;
    }
  });

  if (maxScore === -Infinity || bestIndex === state.activeIndex) {
    return { activeIndex: state.activeIndex, challengerIndex: null, challengerFrames: 0 };
  }

  const currentScore = candidates[state.activeIndex].score;
  if (maxScore > currentScore + 15) {
    if (state.challengerIndex === bestIndex) {
      const frames = state.challengerFrames + 1;
      if (frames >= 3) {
        return { activeIndex: bestIndex, challengerIndex: null, challengerFrames: 0 };
      }
      return { activeIndex: state.activeIndex, challengerIndex: bestIndex, challengerFrames: frames };
    }
    return { activeIndex: state.activeIndex, challengerIndex: bestIndex, challengerFrames: 1 };
  }

  return { activeIndex: state.activeIndex, challengerIndex: null, challengerFrames: 0 };
}

/**
 * Checks mesh occlusion from camera position to anchor target using raycaster.
 */
export function checkMeshOcclusion(
  camera: THREE.Camera,
  anchorWorld: THREE.Vector3,
  loadedObject: THREE.Object3D,
  raycaster: THREE.Raycaster,
  epsilon: number,
): boolean {
  const direction = anchorWorld.clone().sub(camera.position);
  const anchorDistance = direction.length();
  direction.normalize();

  raycaster.set(camera.position, direction);
  raycaster.near = 0;
  raycaster.far = Math.max(0, anchorDistance - epsilon);

  return raycaster.intersectObject(loadedObject, true).length > 0;
}
