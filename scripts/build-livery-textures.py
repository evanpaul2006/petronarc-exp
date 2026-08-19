"""Deterministically projection-paint the Petronarc reference livery.

The mesh is an auto-unwrapped reconstruction with thousands of disconnected
charts. This script implements the same camera/stencil projection workflow used
by a 3D paint tool, while keeping the existing OBJ and UV coordinates intact.
"""

from __future__ import annotations

import argparse
import shutil
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont


ASSET_MAPS = ("basecolor.png", "roughness.png", "metallic.png", "normal.png", "ao.png")
SILVER = (176, 184, 190, 255)
BLACK = (7, 11, 14, 255)
BLUE = (0, 119, 201, 255)
WHITE = (244, 246, 247, 255)


@dataclass(frozen=True)
class Mesh:
    vertices: np.ndarray
    uvs: np.ndarray
    faces: np.ndarray


@dataclass(frozen=True)
class Projection:
    u_axis: np.ndarray
    v_axis: np.ndarray
    depth_axis: np.ndarray
    u_range: tuple[float, float]
    v_range: tuple[float, float]
    paint_depth: tuple[float, float]

    def project(self, vertices: np.ndarray, width: int, height: int) -> tuple[np.ndarray, np.ndarray]:
        u = vertices @ self.u_axis
        v = vertices @ self.v_axis
        depth = vertices @ self.depth_axis
        x = (u - self.u_range[0]) / (self.u_range[1] - self.u_range[0]) * (width - 1)
        y = (self.v_range[1] - v) / (self.v_range[1] - self.v_range[0]) * (height - 1)
        return np.column_stack((x, y)), depth


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, default=Path.cwd())
    return parser.parse_args()


def load_mesh(path: Path) -> Mesh:
    vertices: list[list[float]] = []
    uvs: list[list[float]] = []
    faces: list[list[int]] = []
    uv_faces: list[list[int]] = []
    with path.open("r", encoding="utf-8") as obj:
        for line in obj:
            if line.startswith("v "):
                vertices.append([float(value) for value in line.split()[1:4]])
            elif line.startswith("vt "):
                uvs.append([float(value) for value in line.split()[1:3]])
            elif line.startswith("f "):
                refs = [item.split("/") for item in line.split()[1:]]
                if len(refs) != 3:
                    raise ValueError("Projection painter expects triangulated OBJ faces")
                faces.append([int(ref[0]) - 1 for ref in refs])
                uv_faces.append([int(ref[1]) - 1 for ref in refs])
    if faces != uv_faces:
        raise ValueError("The production OBJ must retain its one-to-one xatlas vertex/UV mapping")
    return Mesh(
        vertices=np.asarray(vertices, dtype=np.float32),
        uvs=np.asarray(uvs, dtype=np.float32),
        faces=np.asarray(faces, dtype=np.int32),
    )


def logical_to_pixel(
    points: list[tuple[float, float]],
    projection: Projection,
    size: tuple[int, int],
) -> list[tuple[float, float]]:
    width, height = size
    return [
        (
            (u - projection.u_range[0]) / (projection.u_range[1] - projection.u_range[0]) * width,
            (projection.v_range[1] - v) / (projection.v_range[1] - projection.v_range[0]) * height,
        )
        for u, v in points
    ]


def create_layers(size: tuple[int, int]) -> tuple[Image.Image, Image.Image, Image.Image]:
    return (
        Image.new("RGBA", size, (0, 0, 0, 0)),
        Image.new("RGBA", size, (0, 0, 0, 0)),
        Image.new("RGBA", size, (0, 0, 0, 0)),
    )


def polygon_material(
    layers: tuple[Image.Image, Image.Image, Image.Image],
    points: list[tuple[float, float]],
    color: tuple[int, int, int, int],
    metallic: int,
    roughness: int,
) -> None:
    base, metal, rough = layers
    ImageDraw.Draw(base).polygon(points, fill=color)
    ImageDraw.Draw(metal).polygon(points, fill=(metallic, metallic, metallic, color[3]))
    ImageDraw.Draw(rough).polygon(points, fill=(roughness, roughness, roughness, color[3]))


def line_material(
    layers: tuple[Image.Image, Image.Image, Image.Image],
    points: list[tuple[float, float]],
    width: int,
    color: tuple[int, int, int, int],
    metallic: int,
    roughness: int,
) -> None:
    base, metal, rough = layers
    ImageDraw.Draw(base).line(points, fill=color, width=width, joint="curve")
    ImageDraw.Draw(metal).line(
        points,
        fill=(metallic, metallic, metallic, color[3]),
        width=width,
        joint="curve",
    )
    ImageDraw.Draw(rough).line(
        points,
        fill=(roughness, roughness, roughness, color[3]),
        width=width,
        joint="curve",
    )


def paste_material(
    layers: tuple[Image.Image, Image.Image, Image.Image],
    graphic: Image.Image,
    box: tuple[int, int, int, int],
    metallic: int,
    roughness: int,
) -> None:
    left, top, right, bottom = box
    target_size = (max(1, right - left), max(1, bottom - top))
    graphic = graphic.convert("RGBA")
    graphic.thumbnail(target_size, Image.Resampling.LANCZOS)
    x = left + (target_size[0] - graphic.width) // 2
    y = top + (target_size[1] - graphic.height) // 2
    layers[0].alpha_composite(graphic, (x, y))
    alpha = graphic.getchannel("A")
    metal = Image.new("RGBA", graphic.size, (metallic, metallic, metallic, 0))
    metal.putalpha(alpha)
    rough = Image.new("RGBA", graphic.size, (roughness, roughness, roughness, 0))
    rough.putalpha(alpha)
    layers[1].alpha_composite(metal, (x, y))
    layers[2].alpha_composite(rough, (x, y))


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size=size)


def centered_text(
    image: Image.Image,
    box: tuple[int, int, int, int],
    text: str,
    text_font: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int, int],
) -> None:
    draw = ImageDraw.Draw(image)
    bounds = draw.textbbox((0, 0), text, font=text_font, stroke_width=0)
    width = bounds[2] - bounds[0]
    height = bounds[3] - bounds[1]
    x = box[0] + (box[2] - box[0] - width) / 2
    y = box[1] + (box[3] - box[1] - height) / 2 - bounds[1]
    draw.text((x, y), text, font=text_font, fill=fill)


def side_livery(
    side: int,
    wordmark: Image.Image,
) -> tuple[Projection, tuple[Image.Image, Image.Image, Image.Image]]:
    size = (1760, 800)
    projection = Projection(
        u_axis=np.asarray((float(side), 0.0, 0.0), dtype=np.float32),
        v_axis=np.asarray((0.0, 1.0, 0.0), dtype=np.float32),
        depth_axis=np.asarray((0.0, 0.0, float(side)), dtype=np.float32),
        u_range=(-0.55, 0.55),
        v_range=(-0.25, 0.25),
        paint_depth=(0.02, 0.30),
    )
    layers = create_layers(size)

    def points(world_points: list[tuple[float, float]]) -> list[tuple[float, float]]:
        return logical_to_pixel([(side * x, y) for x, y in world_points], projection, size)

    polygon_material(
        layers,
        points([(0.53, -0.19), (0.53, 0.02), (0.34, 0.082), (0.11, 0.06), (-0.03, 0.012), (-0.03, -0.17)]),
        BLACK,
        metallic=8,
        roughness=118,
    )
    polygon_material(
        layers,
        points([(0.53, 0.018), (0.53, 0.19), (0.03, 0.19), (0.105, 0.067), (0.34, 0.09)]),
        SILVER,
        metallic=224,
        roughness=82,
    )
    line_material(
        layers,
        points([(0.52, 0.018), (0.34, 0.084), (0.105, 0.062), (-0.015, 0.012)]),
        width=13,
        color=BLUE,
        metallic=12,
        roughness=72,
    )

    def rect_from_world(x1: float, y1: float, x2: float, y2: float) -> tuple[int, int, int, int]:
        corners = points([(x1, y1), (x2, y2)])
        xs = sorted((int(corners[0][0]), int(corners[1][0])))
        ys = sorted((int(corners[0][1]), int(corners[1][1])))
        return xs[0], ys[0], xs[1], ys[1]

    logo_box = rect_from_world(0.43, -0.132, 0.075, -0.058)
    if side > 0:
        logo_box = rect_from_world(0.075, -0.132, 0.43, -0.058)
    paste_material(layers, wordmark, logo_box, metallic=35, roughness=64)

    gec_box = rect_from_world(-0.05, -0.052, -0.23, -0.016)
    draw = ImageDraw.Draw(layers[0])
    draw.rounded_rectangle(gec_box, radius=5, fill=(5, 7, 8, 245))
    ImageDraw.Draw(layers[1]).rounded_rectangle(gec_box, radius=5, fill=(5, 5, 5, 245))
    ImageDraw.Draw(layers[2]).rounded_rectangle(gec_box, radius=5, fill=(112, 112, 112, 245))
    centered_text(
        layers[0],
        gec_box,
        "GEC THRISSUR",
        font("C:/Windows/Fonts/timesbd.ttf", 25),
        WHITE,
    )

    center = points([(-0.15, -0.075)])[0]
    radius = 45
    circle = (int(center[0] - radius), int(center[1] - radius), int(center[0] + radius), int(center[1] + radius))
    ImageDraw.Draw(layers[0]).ellipse(circle, fill=WHITE, outline=(73, 78, 82, 255), width=5)
    ImageDraw.Draw(layers[1]).ellipse(circle, fill=(5, 5, 5, 255))
    ImageDraw.Draw(layers[2]).ellipse(circle, fill=(76, 76, 76, 255))
    centered_text(
        layers[0],
        circle,
        "37",
        font("C:/Windows/Fonts/impact.ttf", 70),
        (5, 7, 8, 255),
    )
    return projection, layers


def top_livery(
    mark: Image.Image,
    decals_only: bool = False,
) -> tuple[Projection, tuple[Image.Image, Image.Image, Image.Image]]:
    size = (1600, 1000)
    projection = Projection(
        u_axis=np.asarray((1.0, 0.0, 0.0), dtype=np.float32),
        v_axis=np.asarray((0.0, 0.0, 1.0), dtype=np.float32),
        depth_axis=np.asarray((0.0, 1.0, 0.0), dtype=np.float32),
        u_range=(-0.55, 0.55),
        v_range=(-0.37, 0.37),
        paint_depth=(-0.225, 0.225),
    )
    layers = create_layers(size)
    p = lambda pts: logical_to_pixel(pts, projection, size)

    if not decals_only:
        body = p([(0.535, -0.19), (0.535, 0.19), (0.02, 0.145), (0.02, -0.145)])
        polygon_material(layers, body, SILVER, metallic=224, roughness=82)
        line_material(
            layers,
            p([(0.515, -0.19), (0.30, -0.175), (0.03, -0.145)]),
            width=12,
            color=BLUE,
            metallic=12,
            roughness=72,
        )
        line_material(
            layers,
            p([(0.515, 0.19), (0.30, 0.175), (0.03, 0.145)]),
            width=12,
            color=BLUE,
            metallic=12,
            roughness=72,
        )

    center = p([(0.27, 0.0)])[0]
    oval = (int(center[0] - 118), int(center[1] - 54), int(center[0] + 118), int(center[1] + 54))
    ImageDraw.Draw(layers[0]).ellipse(oval, fill=WHITE, outline=(64, 69, 73, 255), width=6)
    ImageDraw.Draw(layers[1]).ellipse(oval, fill=(5, 5, 5, 255))
    ImageDraw.Draw(layers[2]).ellipse(oval, fill=(74, 74, 74, 255))
    label = Image.new("RGBA", (236, 108), (0, 0, 0, 0))
    centered_text(
        label,
        (0, 0, 236, 108),
        "ICV-37",
        font("C:/Windows/Fonts/arialbd.ttf", 56),
        (5, 7, 8, 255),
    )
    label = label.rotate(180, resample=Image.Resampling.BICUBIC)
    layers[0].alpha_composite(label, (oval[0], oval[1]))

    mark_center = p([(0.075, 0.0)])[0]
    mark_box = (
        int(mark_center[0] - 53),
        int(mark_center[1] - 48),
        int(mark_center[0] + 53),
        int(mark_center[1] + 48),
    )
    paste_material(layers, mark, mark_box, metallic=90, roughness=62)
    return projection, layers


def barycentric_grid(
    triangle: np.ndarray,
    xs: np.ndarray,
    ys: np.ndarray,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    x0, y0 = triangle[0]
    x1, y1 = triangle[1]
    x2, y2 = triangle[2]
    denominator = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2)
    if abs(float(denominator)) < 1e-8:
        empty = np.zeros_like(xs, dtype=np.float32)
        return empty, empty, empty, np.zeros_like(xs, dtype=bool)
    a = ((y1 - y2) * (xs - x2) + (x2 - x1) * (ys - y2)) / denominator
    b = ((y2 - y0) * (xs - x2) + (x0 - x2) * (ys - y2)) / denominator
    c = 1.0 - a - b
    inside = (a >= -0.001) & (b >= -0.001) & (c >= -0.001)
    return a, b, c, inside


def build_zbuffer(mesh: Mesh, projection: Projection, size: tuple[int, int]) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    width, height = size
    projected, depth = projection.project(mesh.vertices, width, height)
    zbuffer = np.full((height, width), -np.inf, dtype=np.float32)
    for face in mesh.faces:
        triangle = projected[face]
        min_x = max(0, int(np.floor(triangle[:, 0].min())))
        max_x = min(width - 1, int(np.ceil(triangle[:, 0].max())))
        min_y = max(0, int(np.floor(triangle[:, 1].min())))
        max_y = min(height - 1, int(np.ceil(triangle[:, 1].max())))
        if min_x > max_x or min_y > max_y:
            continue
        grid_x, grid_y = np.meshgrid(
            np.arange(min_x, max_x + 1, dtype=np.float32) + 0.5,
            np.arange(min_y, max_y + 1, dtype=np.float32) + 0.5,
        )
        a, b, c, inside = barycentric_grid(triangle, grid_x, grid_y)
        if not inside.any():
            continue
        triangle_depth = depth[face]
        values = a * triangle_depth[0] + b * triangle_depth[1] + c * triangle_depth[2]
        region = zbuffer[min_y : max_y + 1, min_x : max_x + 1]
        np.maximum(region, np.where(inside, values, -np.inf), out=region)
    return projected, depth, zbuffer


def project_layers(
    mesh: Mesh,
    projection: Projection,
    layers: tuple[Image.Image, Image.Image, Image.Image],
    targets: tuple[np.ndarray, np.ndarray, np.ndarray],
    painted: np.ndarray,
) -> None:
    width, height = layers[0].size
    texture_height, texture_width = targets[0].shape[:2]
    projected, depth, _zbuffer = build_zbuffer(mesh, projection, (width, height))
    source_layers = [np.asarray(layer, dtype=np.uint8) for layer in layers]

    uv_pixels = np.column_stack(
        (
            mesh.uvs[:, 0] * (texture_width - 1),
            (1.0 - mesh.uvs[:, 1]) * (texture_height - 1),
        )
    )

    for face in mesh.faces:
        uv_triangle = uv_pixels[face]
        min_x = max(0, int(np.floor(uv_triangle[:, 0].min())))
        max_x = min(texture_width - 1, int(np.ceil(uv_triangle[:, 0].max())))
        min_y = max(0, int(np.floor(uv_triangle[:, 1].min())))
        max_y = min(texture_height - 1, int(np.ceil(uv_triangle[:, 1].max())))
        if min_x > max_x or min_y > max_y:
            continue
        grid_x, grid_y = np.meshgrid(
            np.arange(min_x, max_x + 1, dtype=np.float32) + 0.5,
            np.arange(min_y, max_y + 1, dtype=np.float32) + 0.5,
        )
        a, b, c, inside = barycentric_grid(uv_triangle, grid_x, grid_y)
        if not inside.any():
            continue

        screen_triangle = projected[face]
        screen_x = a * screen_triangle[0, 0] + b * screen_triangle[1, 0] + c * screen_triangle[2, 0]
        screen_y = a * screen_triangle[0, 1] + b * screen_triangle[1, 1] + c * screen_triangle[2, 1]
        sx = np.clip(np.rint(screen_x).astype(np.int32), 0, width - 1)
        sy = np.clip(np.rint(screen_y).astype(np.int32), 0, height - 1)
        face_depth = depth[face]
        projected_depth = a * face_depth[0] + b * face_depth[1] + c * face_depth[2]
        # The reconstruction contains many overlapping micro-shells rather
        # than a single watertight body. Restricting by a shallow, camera-side
        # depth slab paints all visible shell layers continuously; a strict
        # z-buffer test would leave the decals fragmented across those shells.
        visible = (
            (projected_depth >= projection.paint_depth[0])
            & (projected_depth <= projection.paint_depth[1])
        )

        region_indices = np.where(inside & visible)
        if not region_indices[0].size:
            continue
        dst_y = region_indices[0] + min_y
        dst_x = region_indices[1] + min_x
        sample_y = sy[region_indices]
        sample_x = sx[region_indices]
        for source, target in zip(source_layers, targets):
            sampled = source[sample_y, sample_x]
            alpha = sampled[:, 3:4].astype(np.float32) / 255.0
            active = alpha[:, 0] > 0.001
            if not active.any():
                continue
            ty = dst_y[active]
            tx = dst_x[active]
            src = sampled[active, :3].astype(np.float32)
            amount = alpha[active]
            current = target[ty, tx, :3].astype(np.float32)
            target[ty, tx, :3] = np.clip(src * amount + current * (1.0 - amount), 0, 255).astype(np.uint8)
            painted[ty, tx] = True


def uv_occupancy(mesh: Mesh, size: tuple[int, int]) -> np.ndarray:
    width, height = size
    occupied = np.zeros((height, width), dtype=bool)
    uv_pixels = np.column_stack(
        (
            mesh.uvs[:, 0] * (width - 1),
            (1.0 - mesh.uvs[:, 1]) * (height - 1),
        )
    )
    for face in mesh.faces:
        triangle = uv_pixels[face]
        min_x = max(0, int(np.floor(triangle[:, 0].min())))
        max_x = min(width - 1, int(np.ceil(triangle[:, 0].max())))
        min_y = max(0, int(np.floor(triangle[:, 1].min())))
        max_y = min(height - 1, int(np.ceil(triangle[:, 1].max())))
        if min_x > max_x or min_y > max_y:
            continue
        grid_x, grid_y = np.meshgrid(
            np.arange(min_x, max_x + 1, dtype=np.float32) + 0.5,
            np.arange(min_y, max_y + 1, dtype=np.float32) + 0.5,
        )
        *_, inside = barycentric_grid(triangle, grid_x, grid_y)
        occupied[min_y : max_y + 1, min_x : max_x + 1] |= inside
    return occupied


def bleed_into_padding(
    target: np.ndarray,
    painted: np.ndarray,
    occupied: np.ndarray,
    iterations: int = 4,
) -> None:
    """Extend newly painted texels into xatlas padding for stable mipmaps."""
    frontier = painted.copy()
    reached = painted.copy()
    height, width = painted.shape
    for _ in range(iterations):
        next_frontier = np.zeros_like(frontier)
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)):
            source_y = slice(max(0, -dy), min(height, height - dy))
            source_x = slice(max(0, -dx), min(width, width - dx))
            dest_y = slice(max(0, dy), min(height, height + dy))
            dest_x = slice(max(0, dx), min(width, width + dx))
            candidates = frontier[source_y, source_x]
            destination_reached = reached[dest_y, dest_x]
            destination_occupied = occupied[dest_y, dest_x]
            assign = candidates & ~destination_reached & ~destination_occupied
            if not assign.any():
                continue
            destination = target[dest_y, dest_x]
            source = target[source_y, source_x]
            destination[assign] = source[assign]
            next_frontier[dest_y, dest_x] |= assign
            reached[dest_y, dest_x] |= assign
        frontier = next_frontier
        if not frontier.any():
            break


def ensure_source_maps(asset_dir: Path, source_dir: Path) -> None:
    source_dir.mkdir(parents=True, exist_ok=True)
    for name in ASSET_MAPS:
        destination = source_dir / name
        if not destination.exists():
            shutil.copy2(asset_dir / name, destination)


def save_guides(
    guides_dir: Path,
    name: str,
    layers: tuple[Image.Image, Image.Image, Image.Image],
) -> None:
    guides_dir.mkdir(parents=True, exist_ok=True)
    layers[0].save(guides_dir / f"{name}-basecolor.png", optimize=True)
    layers[1].save(guides_dir / f"{name}-metallic.png", optimize=True)
    layers[2].save(guides_dir / f"{name}-roughness.png", optimize=True)


def main() -> None:
    args = parse_args()
    repo_root = args.repo_root.resolve()
    asset_dir = repo_root / "public" / "models" / "formula-student"
    artwork_dir = repo_root / "artwork" / "formula-student-livery"
    source_dir = artwork_dir / "source-maps"
    guides_dir = artwork_dir / "projection-guides"
    ensure_source_maps(asset_dir, source_dir)

    mesh = load_mesh(asset_dir / "model.obj")
    base = np.asarray(Image.open(source_dir / "basecolor.png").convert("RGBA"), dtype=np.uint8).copy()
    rough = np.asarray(Image.open(source_dir / "roughness.png").convert("RGBA"), dtype=np.uint8).copy()
    metal = np.asarray(Image.open(source_dir / "metallic.png").convert("RGBA"), dtype=np.uint8).copy()
    painted = np.zeros(base.shape[:2], dtype=bool)

    wordmark = Image.open(repo_root / "public" / "petronarc-logo-wordmark.png")
    mark = Image.open(repo_root / "public" / "petronarc-logo-mark.png")
    projections = [
        ("top", *top_livery(mark)),
        ("left", *side_livery(-1, wordmark)),
        ("right", *side_livery(1, wordmark)),
        ("top-decals", *top_livery(mark, decals_only=True)),
    ]
    for name, projection, layers in projections:
        save_guides(guides_dir, name, layers)
        project_layers(mesh, projection, layers, (base, metal, rough), painted)

    occupied = uv_occupancy(mesh, (base.shape[1], base.shape[0]))
    for target in (base, metal, rough):
        bleed_into_padding(target, painted, occupied)

    Image.fromarray(base, "RGBA").convert("RGB").save(asset_dir / "basecolor.png", optimize=True)
    Image.fromarray(rough, "RGBA").save(asset_dir / "roughness.png", optimize=True)
    Image.fromarray(metal, "RGBA").save(asset_dir / "metallic.png", optimize=True)


if __name__ == "__main__":
    main()
