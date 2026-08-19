"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import {
  type AnchorSelectionState,
  calculateCandidateScore,
  calculateEdgeClearance,
  checkMeshOcclusion,
  isPointVisibleInFrustum,
  updateAnchorSelection,
} from "./kart-marker-math";
import { formatInr, getSystemById, MARKER_SYSTEMS, type SystemId } from "./kart-systems";
import { ENVIRONMENT_THEMES, type EnvironmentThemeId } from "./kart-environment";
import styles from "./dashboard.module.css";

const MODEL_ROOT = "/models/formula-student";

type LoadState = "loading" | "ready" | "error";

export type FocusRequest = {
  id: SystemId;
  sequence: number;
} | null;

interface KartModelProps {
  selectedId: SystemId;
  focusRequest: FocusRequest;
  onSelectSystem: (id: SystemId) => void;
  systemCosts?: Record<SystemId, number>;
  environmentTheme?: EnvironmentThemeId;
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.7 9A8 8 0 1 1 5 16.2M4.7 9V4.5M4.7 9h4.5" />
    </svg>
  );
}

export default function KartModel({
  selectedId,
  focusRequest,
  onSelectSystem,
  systemCosts,
  environmentTheme = "cyber",
}: KartModelProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const resetViewRef = useRef<(() => void) | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [progress, setProgress] = useState(0);
  const [isCalibrationMode, setIsCalibrationMode] = useState(false);

  const lightGroupRef = useRef<{
    hemiLight: THREE.HemisphereLight;
    keyLight: THREE.DirectionalLight;
    rimLight: THREE.DirectionalLight;
    fillLight: THREE.DirectionalLight;
    shadowMaterial: THREE.ShadowMaterial;
    renderer: THREE.WebGLRenderer;
  } | null>(null);

  const anchorRefs = useRef<Map<SystemId, HTMLDivElement>>(new Map());
  const buttonRefs = useRef<Map<SystemId, HTMLButtonElement>>(new Map());
  const assemblyRefs = useRef<Map<SystemId, HTMLSpanElement>>(new Map());

  const focusSystemRef = useRef<((request: FocusRequest) => void) | null>(null);
  const pendingFocusRef = useRef<FocusRequest>(null);
  const isModelLoadedRef = useRef(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsCalibrationMode(
        process.env.NODE_ENV === "development" &&
          new URLSearchParams(window.location.search).get("calibrate") === "true",
      );
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  // Bridge focus requests into long-lived Three.js loop
  useEffect(() => {
    if (!focusRequest) return;
    if (focusSystemRef.current && isModelLoadedRef.current) {
      focusSystemRef.current(focusRequest);
    } else {
      pendingFocusRef.current = focusRequest;
    }
  }, [focusRequest]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let frame = 0;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 50);
    camera.position.set(1.82, 0.96, 2.02);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      queueMicrotask(() => setLoadState("error"));
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.className = styles.modelCanvas;
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = false;
    controls.minDistance = 1.55;
    controls.maxDistance = 3.75;
    controls.minPolarAngle = Math.PI * 0.18;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.rotateSpeed = 0.65;
    controls.zoomSpeed = 0.7;
    controls.target.set(0, -0.01, 0);

    const initialCamera = camera.position.clone();
    const initialTarget = controls.target.clone();

    // Camera animation state
    let cameraTransition: {
      startedAt: number;
      durationMs: number;
      fromPosition: THREE.Vector3;
      toPosition: THREE.Vector3;
      fromTarget: THREE.Vector3;
      toTarget: THREE.Vector3;
    } | null = null;

    const cancelTransition = () => {
      cameraTransition = null;
    };

    controls.addEventListener("start", cancelTransition);

    resetViewRef.current = () => {
      cancelTransition();
      camera.position.copy(initialCamera);
      controls.target.copy(initialTarget);
      controls.update();
    };

    const initialTheme = ENVIRONMENT_THEMES[environmentTheme] ?? ENVIRONMENT_THEMES.cyber;

    const hemiLight = new THREE.HemisphereLight(
      initialTheme.hemiSkyColor,
      initialTheme.hemiGroundColor,
      initialTheme.hemiIntensity,
    );
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(
      initialTheme.keyLightColor,
      initialTheme.keyLightIntensity,
    );
    keyLight.position.set(...initialTheme.keyLightPos);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 10;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(
      initialTheme.rimLightColor,
      initialTheme.rimLightIntensity,
    );
    rimLight.position.set(...initialTheme.rimLightPos);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(
      initialTheme.fillLightColor,
      initialTheme.fillLightIntensity,
    );
    fillLight.position.set(...initialTheme.fillLightPos);
    scene.add(fillLight);

    const shadowMaterial = new THREE.ShadowMaterial({
      color: initialTheme.shadowColor,
      opacity: initialTheme.shadowOpacity,
    });
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(initialTheme.floorSize, initialTheme.floorSize),
      shadowMaterial,
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.38;
    floor.receiveShadow = true;
    scene.add(floor);

    renderer.toneMappingExposure = initialTheme.toneMappingExposure;

    lightGroupRef.current = {
      hemiLight,
      keyLight,
      rimLight,
      fillLight,
      shadowMaterial,
      renderer,
    };

    const loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = (_url, loaded, total) => {
      if (!disposed) setProgress(Math.round((loaded / total) * 100));
    };
    loadingManager.onError = () => {
      if (!disposed) setLoadState("error");
    };

    const textureLoader = new THREE.TextureLoader(loadingManager);
    const baseColor = textureLoader.load(`${MODEL_ROOT}/basecolor.png`);
    baseColor.colorSpace = THREE.SRGBColorSpace;
    baseColor.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

    const normal = textureLoader.load(`${MODEL_ROOT}/normal.png`);
    const roughness = textureLoader.load(`${MODEL_ROOT}/roughness.png`);
    const metallic = textureLoader.load(`${MODEL_ROOT}/metallic.png`);
    const ao = textureLoader.load(`${MODEL_ROOT}/ao.png`);
    ao.channel = 1;

    const material = new THREE.MeshStandardMaterial({
      map: baseColor,
      normalMap: normal,
      roughnessMap: roughness,
      metalnessMap: metallic,
      aoMap: ao,
      aoMapIntensity: 0.9,
      metalness: 1,
      roughness: 1,
    });

    const modelGroup = new THREE.Group();
    modelGroup.rotation.y = -0.18;
    modelGroup.rotation.x = -0.035;
    scene.add(modelGroup);

    // Identity coordinate frame for 3D anchors
    const normalizedModelGroup = new THREE.Group();
    modelGroup.add(normalizedModelGroup);

    let loadedMeshObject: THREE.Object3D | null = null;
    let raycastEpsilon = 0.02;

    const occlusionRaycaster = new THREE.Raycaster();
    const calibrationRaycaster = new THREE.Raycaster();

    const objLoader = new OBJLoader(loadingManager);
    objLoader.load(
      `${MODEL_ROOT}/model.obj`,
      (object) => {
        if (disposed) return;

        object.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          const geometry = child.geometry as THREE.BufferGeometry;
          const uv = geometry.getAttribute("uv");
          if (uv && !geometry.getAttribute("uv1")) geometry.setAttribute("uv1", uv);
          if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
          child.material = material;
          child.castShadow = true;
          child.receiveShadow = true;
        });

        const bounds = new THREE.Box3().setFromObject(object);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const sphere = bounds.getBoundingSphere(new THREE.Sphere());

        const scale = 1.72 / Math.max(size.x, size.z);
        const modelRadius = sphere.radius * scale;
        raycastEpsilon = Math.max(0.01, modelRadius * 0.02);

        object.scale.setScalar(scale);
        object.position.set(
          -center.x * scale,
          -center.y * scale - 0.05,
          -center.z * scale,
        );

        normalizedModelGroup.add(object);
        loadedMeshObject = object;

        scene.updateMatrixWorld(true);
        isModelLoadedRef.current = true;
        setLoadState("ready");

        // Drain queued focus request
        if (pendingFocusRef.current && focusSystemRef.current) {
          const queuedRequest = pendingFocusRef.current;
          pendingFocusRef.current = null;
          focusSystemRef.current(queuedRequest);
        }
      },
      undefined,
      () => {
        if (!disposed) setLoadState("error");
      },
    );

    // Dev-only click calibration tool
    const isCalibrationEnabled =
      process.env.NODE_ENV === "development" &&
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("calibrate") === "true";

    let pointerDownPos = { x: 0, y: 0 };
    const handlePointerDown = (event: PointerEvent) => {
      pointerDownPos = { x: event.clientX, y: event.clientY };
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!isCalibrationEnabled || !loadedMeshObject) return;
      const dx = event.clientX - pointerDownPos.x;
      const dy = event.clientY - pointerDownPos.y;
      if (Math.hypot(dx, dy) > 4) return; // Ignore drag gestures

      const rect = host.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      calibrationRaycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      calibrationRaycaster.near = 0;
      calibrationRaycaster.far = Infinity;

      const hits = calibrationRaycaster.intersectObject(loadedMeshObject, true);
      if (hits.length > 0) {
        const worldHit = hits[0].point;
        const localHit = normalizedModelGroup.worldToLocal(worldHit.clone());
        console.log(
          `[3D Calibration Anchor] [${localHit.x.toFixed(3)}, ${localHit.y.toFixed(3)}, ${localHit.z.toFixed(3)}]`,
        );
      }
    };

    if (isCalibrationEnabled) {
      host.addEventListener("pointerdown", handlePointerDown);
      host.addEventListener("pointerup", handlePointerUp);
    }

    // Imperative focus handler
    focusSystemRef.current = (req: FocusRequest) => {
      if (!req || !isModelLoadedRef.current) return;
      const system = getSystemById(req.id);
      // Systems without 3D anchors (safety gear, assembly) have nothing to focus on.
      if (!system || system.anchors3D.length === 0) return;

      const primaryAnchorVec = new THREE.Vector3(...system.anchors3D[0]);
      const targetWorldPos = primaryAnchorVec
        .clone()
        .applyMatrix4(normalizedModelGroup.matrixWorld);

      const offsetWorld = new THREE.Vector3(...system.cameraOffset).applyQuaternion(
        modelGroup.quaternion,
      );

      const rawCamPos = targetWorldPos.clone().add(offsetWorld);
      const camDir = rawCamPos.clone().sub(targetWorldPos);
      const clampedDist = THREE.MathUtils.clamp(
        camDir.length(),
        controls.minDistance,
        controls.maxDistance,
      );
      camDir.setLength(clampedDist);
      const toPosition = targetWorldPos.clone().add(camDir);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        camera.position.copy(toPosition);
        controls.target.copy(targetWorldPos);
        controls.update();
        cameraTransition = null;
      } else {
        cameraTransition = {
          startedAt: performance.now(),
          durationMs: 600,
          fromPosition: camera.position.clone(),
          toPosition,
          fromTarget: controls.target.clone(),
          toTarget: targetWorldPos,
        };
      }
    };

    // System selection hysteresis state tracking
    // Built from MARKER_SYSTEMS so adding a system never needs a matching entry here.
    const systemSelectionState = Object.fromEntries(
      MARKER_SYSTEMS.map((system) => [
        system.id,
        { activeIndex: 0, challengerIndex: null, challengerFrames: 0 },
      ]),
    ) as Record<SystemId, AnchorSelectionState>;

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    // 10-Step Main Render Loop Execution Pipeline
    const render = () => {
      const { width: hostWidth, height: hostHeight } = host.getBoundingClientRect();

      // Step 1: Advance Camera Focus Transition
      if (cameraTransition) {
        const elapsed = performance.now() - cameraTransition.startedAt;
        const progress = Math.min(1.0, elapsed / cameraTransition.durationMs);
        const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease-out

        camera.position.lerpVectors(
          cameraTransition.fromPosition,
          cameraTransition.toPosition,
          ease,
        );
        controls.target.lerpVectors(
          cameraTransition.fromTarget,
          cameraTransition.toTarget,
          ease,
        );

        if (progress >= 1.0) cameraTransition = null;
      }

      // Step 2: Update Orbit Controls
      controls.update();

      // Step 3: Synchronize Matrices
      scene.updateMatrixWorld(true);
      camera.updateMatrixWorld();

      // Step 4: WebGL Render Pass
      renderer.render(scene, camera);

      // Steps 5-10: Hotspot Transform & Visibility Pass
      if (hostWidth && hostHeight && isModelLoadedRef.current && loadedMeshObject) {
        const tempCameraSpacePos = new THREE.Vector3();

        MARKER_SYSTEMS.forEach((system) => {
          const anchorEl = anchorRefs.current.get(system.id);
          const buttonEl = buttonRefs.current.get(system.id);
          const assemblyEl = assemblyRefs.current.get(system.id);
          if (!anchorEl || !buttonEl || !assemblyEl) return;

          const candidatesScoreList: Array<{ isVisible: boolean; score: number }> = [];
          const candidateDataList: Array<{
            worldPos: THREE.Vector3;
            ndc: THREE.Vector3;
            isVisible: boolean;
            isOccluded: boolean;
          }> = [];

          system.anchors3D.forEach((anchorCoords) => {
            const anchorLocal = new THREE.Vector3(...anchorCoords);
            const anchorWorld = anchorLocal
              .clone()
              .applyMatrix4(normalizedModelGroup.matrixWorld);

            const ndc = anchorWorld.clone().project(camera);
            tempCameraSpacePos.copy(anchorWorld).applyMatrix4(camera.matrixWorldInverse);

            // Step 6: Frustum Bounds Check
            const isVisibleInFrustum = isPointVisibleInFrustum(ndc, tempCameraSpacePos.z);

            // Step 7: Raycast Mesh Occlusion
            let isOccluded = false;
            if (isVisibleInFrustum && loadedMeshObject) {
              isOccluded = checkMeshOcclusion(
                camera,
                anchorWorld,
                loadedMeshObject,
                occlusionRaycaster,
                raycastEpsilon,
              );
            }

            const edgeClearance = calculateEdgeClearance(ndc);
            const camDist = tempCameraSpacePos.length();
            const score = calculateCandidateScore(isOccluded, edgeClearance, camDist);

            candidatesScoreList.push({ isVisible: isVisibleInFrustum, score });
            candidateDataList.push({
              worldPos: anchorWorld,
              ndc,
              isVisible: isVisibleInFrustum,
              isOccluded,
            });
          });

          // Step 8: Run Hysteresis Candidate Selection
          const nextState = updateAnchorSelection(
            systemSelectionState[system.id],
            candidatesScoreList,
          );
          systemSelectionState[system.id] = nextState;

          const selectedCandidate = candidateDataList[nextState.activeIndex] ?? candidateDataList[0];

          if (!selectedCandidate) return;

          const { ndc, isVisible, isOccluded } = selectedCandidate;

          // Step 9: Apply GPU-Accelerated Positioning
          const screenX = Math.round((ndc.x * 0.5 + 0.5) * hostWidth);
          const screenY = Math.round((-ndc.y * 0.5 + 0.5) * hostHeight);

          anchorEl.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`;

          if (screenX > hostWidth * 0.68) {
            assemblyEl.classList.add(styles.hotspotAssemblyLeft);
          } else {
            assemblyEl.classList.remove(styles.hotspotAssemblyLeft);
          }

          // Step 10: Apply Visibility & Accessibility Attributes
          if (!isVisible) {
            anchorEl.style.display = "none";
            buttonEl.style.pointerEvents = "none";
            buttonEl.tabIndex = -1;
            buttonEl.setAttribute("aria-hidden", "true");
          } else {
            anchorEl.style.display = "block";
            anchorEl.style.opacity = isOccluded ? "0.25" : "1.0";
            buttonEl.style.pointerEvents = isOccluded ? "none" : "auto";
            buttonEl.tabIndex = isOccluded ? -1 : 0;
            buttonEl.setAttribute("aria-hidden", isOccluded ? "true" : "false");
          }

          // Accessibility Focus Transfer Fallback
          if (document.activeElement === buttonEl && (!isVisible || isOccluded)) {
            const detailHeading = document.getElementById("focused-system-heading");
            if (detailHeading) {
              detailHeading.focus();
            } else {
              hostRef.current?.focus();
            }
          }
        });
      }

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);

    return () => {
      disposed = true;
      focusSystemRef.current = null;
      resetViewRef.current = null;
      lightGroupRef.current = null;
      cancelAnimationFrame(frame);
      if (isCalibrationEnabled) {
        host.removeEventListener("pointerdown", handlePointerDown);
        host.removeEventListener("pointerup", handlePointerUp);
      }
      resizeObserver.disconnect();
      controls.removeEventListener("start", cancelTransition);
      controls.dispose();
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) child.geometry.dispose();
      });
      material.dispose();
      baseColor.dispose();
      normal.dispose();
      roughness.dispose();
      metallic.dispose();
      ao.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  // Dynamically update Three.js environment lighting and floor shadow
  useEffect(() => {
    const group = lightGroupRef.current;
    if (!group) return;

    const theme = ENVIRONMENT_THEMES[environmentTheme] ?? ENVIRONMENT_THEMES.cyber;

    group.hemiLight.color.setHex(theme.hemiSkyColor);
    group.hemiLight.groundColor.setHex(theme.hemiGroundColor);
    group.hemiLight.intensity = theme.hemiIntensity;

    group.keyLight.color.setHex(theme.keyLightColor);
    group.keyLight.intensity = theme.keyLightIntensity;
    group.keyLight.position.set(...theme.keyLightPos);

    group.rimLight.color.setHex(theme.rimLightColor);
    group.rimLight.intensity = theme.rimLightIntensity;
    group.rimLight.position.set(...theme.rimLightPos);

    group.fillLight.color.setHex(theme.fillLightColor);
    group.fillLight.intensity = theme.fillLightIntensity;
    group.fillLight.position.set(...theme.fillLightPos);

    group.shadowMaterial.color.setHex(theme.shadowColor);
    group.shadowMaterial.opacity = theme.shadowOpacity;

    group.renderer.toneMappingExposure = theme.toneMappingExposure;
  }, [environmentTheme]);

  return (
    <div className={styles.modelShell}>
      <div
        ref={hostRef}
        className={styles.modelHost}
        tabIndex={-1}
        role="img"
        aria-label="Interactive three-dimensional Formula Student race car. Drag to rotate and scroll to zoom."
      />

      <div className={styles.hotspotOverlay}>
        {(isCalibrationMode ? MARKER_SYSTEMS.filter((s) => s.id === selectedId) : MARKER_SYSTEMS).map((system) => {
          const isActive = system.id === selectedId;
          const cost = systemCosts ? systemCosts[system.id] || 0 : 0;
          return (
            <div
              key={system.id}
              className={styles.hotspotAnchor}
              ref={(el) => {
                if (el) anchorRefs.current.set(system.id, el);
                else anchorRefs.current.delete(system.id);
              }}
            >
              <button
                type="button"
                className={`${styles.hotspot} ${isActive ? styles.hotspotActive : ""}`}
                aria-label={`Select ${system.name}, Total Cost: ${formatInr(cost)}`}
                aria-pressed={isActive}
                ref={(el) => {
                  if (el) buttonRefs.current.set(system.id, el);
                  else buttonRefs.current.delete(system.id);
                }}
                onClick={() => onSelectSystem(system.id)}
              >
                <span className={styles.hotspotDot}>
                  <i />
                </span>
                <span
                  className={styles.hotspotAssembly}
                  ref={(el) => {
                    if (el) assemblyRefs.current.set(system.id, el);
                    else assemblyRefs.current.delete(system.id);
                  }}
                >
                  <span className={styles.hotspotLine} />
                  <span className={styles.hotspotLabel}>
                    <strong>{system.name}</strong>
                    <small>{formatInr(cost)}</small>
                  </span>
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {loadState === "loading" && (
        <div className={styles.modelLoading} role="status" aria-live="polite">
          <span className={styles.modelLoaderTrack}>
            <i style={{ width: `${Math.max(progress, 8)}%` }} />
          </span>
          <span>
            <small>STREAMING PBR ASSET</small>
            <strong>{progress ? `${progress}%` : "INITIALIZING"}</strong>
          </span>
        </div>
      )}

      {loadState === "error" && (
        <div className={styles.modelError} role="status">
          <small>3D VIEW UNAVAILABLE</small>
          <strong>WebGL or model loading failed</strong>
        </div>
      )}

      {loadState === "ready" && (
        <button
          type="button"
          className={`${styles.resetView} ${
            environmentTheme === "studio" ? styles.resetViewStudio : ""
          }`}
          onClick={() => resetViewRef.current?.()}
          aria-label="Reset 3D model view"
        >
          <ResetIcon />
          <span>RESET VIEW</span>
        </button>
      )}
    </div>
  );
}
