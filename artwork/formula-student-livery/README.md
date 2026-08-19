# Petronarc reference livery

This folder contains the reproducible source and validation output for the
Formula Student livery used by the web viewer.

## Rebuild the texture maps

From the repository root, with Python, Pillow, and NumPy available:

```powershell
python scripts\build-livery-textures.py --repo-root .
```

The builder always starts from `source-maps/`, projection-paints the silver,
matte-black, and blue body treatment, and applies the Petronarc, `ICV-37`,
`37`, and `GEC THRISSUR` decals. It writes the finished base-color, metallic,
and roughness maps back to `public/models/formula-student/` without modifying
the OBJ, normal map, AO map, coordinate frame, or hotspot anchors.

The decal typography uses the standard Windows Arial, Impact, and Times New
Roman fonts. The Petronarc marks come from the existing PNG brand assets in
`public/`.

## Rebuild the Blender scene and validation renders

With Blender 4.5 LTS or newer on `PATH`:

```powershell
blender --background --python scripts\render-livery-validation.py -- --repo-root .
```

This refreshes `petronarc-reference-livery.blend` and renders the reference,
opposite-side, rear, direct-side, and top validation angles under
`validation/`.
