import { describe, expect, it } from "vitest";
import { systemId as convexSystemId } from "../convex/schema";
import { KART_SYSTEMS, MARKER_SYSTEMS } from "./kart-systems";

describe("kart systems", () => {
  it("exposes only anchored systems as 3D markers", () => {
    expect(MARKER_SYSTEMS.map((s) => s.id)).toEqual([
      "brake",
      "chassis",
      "steering",
      "suspension",
      "wheels",
      "electrical",
      "engine",
      "seat",
    ]);
    expect(MARKER_SYSTEMS.every((s) => s.anchors3D.length > 0)).toBe(true);
  });

  it("keeps the Convex systemId validator in sync with SystemId", () => {
    const validatorIds = convexSystemId.members.map((member) => member.value);
    expect([...validatorIds].sort()).toEqual(KART_SYSTEMS.map((s) => s.id).sort());
  });

  it("gives every system a unique id", () => {
    const ids = KART_SYSTEMS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
