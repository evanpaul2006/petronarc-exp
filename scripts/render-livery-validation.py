"""Build the reusable Blender livery scene and render validation angles.

Run with Blender, for example:
  blender --background --python scripts/render-livery-validation.py -- --repo-root .
"""

from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def parse_args() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path)
    parser.add_argument("--skip-save", action="store_true")
    return parser.parse_args(argv)


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in bpy.data.materials:
        bpy.data.materials.remove(block)


def load_image(path: Path, non_color: bool = False) -> bpy.types.Image:
    image = bpy.data.images.load(str(path), check_existing=False)
    if non_color:
        image.colorspace_settings.name = "Non-Color"
    return image


def image_node(
    nodes: bpy.types.Nodes,
    name: str,
    image: bpy.types.Image,
    x: float,
    y: float,
) -> bpy.types.ShaderNodeTexImage:
    node = nodes.new("ShaderNodeTexImage")
    node.name = name
    node.label = name
    node.image = image
    node.location = (x, y)
    return node


def build_material(asset_dir: Path) -> bpy.types.Material:
    material = bpy.data.materials.new("Petronarc Reference Livery")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links

    principled = nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = (0.03, 0.03, 0.03, 1.0)
    principled.inputs["Metallic"].default_value = 1.0
    principled.inputs["Roughness"].default_value = 1.0

    base = image_node(nodes, "Base Color", load_image(asset_dir / "basecolor.png"), -620, 240)
    roughness = image_node(
        nodes,
        "Roughness",
        load_image(asset_dir / "roughness.png", non_color=True),
        -620,
        20,
    )
    metallic = image_node(
        nodes,
        "Metallic",
        load_image(asset_dir / "metallic.png", non_color=True),
        -620,
        -180,
    )
    normal = image_node(
        nodes,
        "Normal",
        load_image(asset_dir / "normal.png", non_color=True),
        -620,
        -390,
    )
    normal_map = nodes.new("ShaderNodeNormalMap")
    normal_map.location = (-310, -390)
    normal_map.inputs["Strength"].default_value = 0.72

    links.new(base.outputs["Color"], principled.inputs["Base Color"])
    links.new(roughness.outputs["Color"], principled.inputs["Roughness"])
    links.new(metallic.outputs["Color"], principled.inputs["Metallic"])
    links.new(normal.outputs["Color"], normal_map.inputs["Color"])
    links.new(normal_map.outputs["Normal"], principled.inputs["Normal"])
    return material


def import_model(asset_dir: Path, material: bpy.types.Material) -> bpy.types.Object:
    bpy.ops.wm.obj_import(filepath=str(asset_dir / "model.obj"), forward_axis="NEGATIVE_Z", up_axis="Y")
    mesh_objects = [obj for obj in bpy.context.selected_objects if obj.type == "MESH"]
    if not mesh_objects:
        raise RuntimeError("OBJ import did not create a mesh")
    model = mesh_objects[0]
    model.name = "Formula Student — Reference Livery"
    model.data.materials.clear()
    model.data.materials.append(material)
    for polygon in model.data.polygons:
        polygon.use_smooth = True
    return model


def look_at(obj: bpy.types.Object, target: Vector) -> None:
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def add_area_light(name: str, location: tuple[float, float, float], energy: float, size: float) -> None:
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.shape = "DISK"
    data.size = size
    light = bpy.data.objects.new(name, data)
    light.location = location
    bpy.context.scene.collection.objects.link(light)
    look_at(light, Vector((0.0, 0.0, 0.0)))


def setup_stage() -> bpy.types.Object:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 800
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.look = "AgX - Medium High Contrast"

    world = scene.world or bpy.data.worlds.new("Petronarc Studio")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.006, 0.012, 0.018, 1.0)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.14

    bpy.ops.mesh.primitive_plane_add(size=5.5, location=(0.0, 0.0, -0.235))
    floor = bpy.context.object
    floor.name = "Validation Floor"
    floor_material = bpy.data.materials.new("Validation Floor")
    floor_material.diffuse_color = (0.008, 0.016, 0.021, 1.0)
    floor_material.use_nodes = True
    floor_principled = floor_material.node_tree.nodes["Principled BSDF"]
    floor_principled.inputs["Base Color"].default_value = (0.008, 0.016, 0.021, 1.0)
    floor_principled.inputs["Metallic"].default_value = 0.1
    floor_principled.inputs["Roughness"].default_value = 0.34
    floor.data.materials.append(floor_material)

    add_area_light("Key", (1.6, -1.8, 1.8), 950.0, 2.3)
    add_area_light("Fill", (-1.5, 1.2, 0.9), 620.0, 2.0)
    add_area_light("Rim", (-0.6, 1.8, 1.4), 850.0, 1.6)

    camera_data = bpy.data.cameras.new("Validation Camera")
    camera_data.lens = 55
    camera = bpy.data.objects.new("Validation Camera", camera_data)
    scene.collection.objects.link(camera)
    scene.camera = camera
    return camera


def render_angle(
    camera: bpy.types.Object,
    output_dir: Path,
    name: str,
    location: tuple[float, float, float],
) -> None:
    camera.location = location
    look_at(camera, Vector((0.0, 0.0, -0.025)))
    bpy.context.scene.render.filepath = str(output_dir / f"{name}.png")
    bpy.ops.render.render(write_still=True)


def main() -> None:
    args = parse_args()
    repo_root = args.repo_root.resolve()
    asset_dir = repo_root / "public" / "models" / "formula-student"
    output_dir = (args.output_dir or repo_root / "artwork" / "formula-student-livery" / "validation").resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    clear_scene()
    material = build_material(asset_dir)
    import_model(asset_dir, material)
    camera = setup_stage()

    render_angle(camera, output_dir, "reference-angle", (1.45, -1.55, 0.72))
    render_angle(camera, output_dir, "opposite-side", (1.45, 1.55, 0.72))
    render_angle(camera, output_dir, "rear-check", (-1.65, 1.1, 0.68))
    render_angle(camera, output_dir, "direct-side", (0.0, 2.1, 0.04))
    render_angle(camera, output_dir, "top-check", (0.0, 0.0, 2.1))

    if not args.skip_save:
        blend_path = repo_root / "artwork" / "formula-student-livery" / "petronarc-reference-livery.blend"
        blend_path.parent.mkdir(parents=True, exist_ok=True)
        bpy.ops.file.make_paths_relative()
        bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))


if __name__ == "__main__":
    main()
