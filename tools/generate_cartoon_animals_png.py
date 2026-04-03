from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "static" / "images" / "animals"


def _shadow_ellipse(base: Image.Image, bbox: tuple[int, int, int, int], blur: int = 18, opacity: int = 90) -> None:
    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(shadow)
    d.ellipse(bbox, fill=(0, 0, 0, opacity))
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(shadow)


def _soft_highlight(base: Image.Image, bbox: tuple[int, int, int, int], color=(255, 255, 255), opacity: int = 70, blur: int = 14) -> None:
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse(bbox, fill=(*color, opacity))
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(layer)


def _soft_shade(base: Image.Image, bbox: tuple[int, int, int, int], opacity: int = 65, blur: int = 16) -> None:
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse(bbox, fill=(0, 0, 0, opacity))
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(layer)


def _outline(d: ImageDraw.ImageDraw, shape: str, bbox_or_points, fill, outline=(0, 0, 0, 255), width: int = 10):
    if shape == "ellipse":
        d.ellipse(bbox_or_points, fill=fill, outline=outline, width=width)
    elif shape == "rounded_rectangle":
        d.rounded_rectangle(bbox_or_points, radius=28, fill=fill, outline=outline, width=width)
    elif shape == "polygon":
        # Pillow's polygon outline does not reliably support width; emulate thick outline.
        points = list(bbox_or_points)
        d.polygon(points, fill=fill)
        if len(points) >= 2:
            d.line(points + [points[0]], fill=outline, width=width, joint="curve")
    else:
        raise ValueError(shape)


def _eye(d: ImageDraw.ImageDraw, cx: int, cy: int, r: int, pupil: str = "round"):
    # white
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(255, 255, 255, 255), outline=(0, 0, 0, 255), width=max(4, r // 3))
    # iris
    d.ellipse((cx - int(r * 0.55), cy - int(r * 0.45), cx + int(r * 0.55), cy + int(r * 0.65)), fill=(60, 44, 35, 255))
    # pupil
    if pupil == "slit":
        d.rounded_rectangle((cx - int(r * 0.18), cy - int(r * 0.55), cx + int(r * 0.18), cy + int(r * 0.75)), radius=int(r * 0.12), fill=(0, 0, 0, 255))
    else:
        d.ellipse((cx - int(r * 0.25), cy - int(r * 0.25), cx + int(r * 0.25), cy + int(r * 0.25)), fill=(0, 0, 0, 255))
    # highlight
    d.ellipse((cx - int(r * 0.45), cy - int(r * 0.45), cx - int(r * 0.15), cy - int(r * 0.15)), fill=(255, 255, 255, 230))


def draw_dog(size: int = 512) -> Image.Image:
    # Worksheet/clipart style: opaque white background, thick outlines, minimal shading.
    img = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    d = ImageDraw.Draw(img)

    outline = (0, 0, 0, 255)
    w = max(12, size // 32)

    # colors
    body = (206, 124, 52, 255)
    body2 = (182, 97, 33, 255)
    ear = (134, 74, 28, 255)
    muzzle = (240, 215, 170, 255)

    # tail (crisp)
    td_points = [
        (int(size * 0.70), int(size * 0.58)),
        (int(size * 0.85), int(size * 0.52)),
        (int(size * 0.90), int(size * 0.60)),
    ]
    d.line(td_points, fill=body2, width=int(w * 2.2), joint="curve")
    d.line(td_points, fill=outline, width=int(w * 2.8), joint="curve")

    # body
    _outline(
        d,
        "ellipse",
        (int(size * 0.22), int(size * 0.44), int(size * 0.78), int(size * 0.80)),
        fill=body,
        outline=outline,
        width=w,
    )
    # simple belly patch (flat)
    d.ellipse(
        (int(size * 0.30), int(size * 0.52), int(size * 0.60), int(size * 0.76)),
        fill=(245, 225, 195, 255),
        outline=outline,
        width=max(8, w - 4),
    )

    # spots (flat, crisp)
    for bx, by, brx, bry in [
        (0.33, 0.58, 0.075, 0.055),
        (0.66, 0.60, 0.095, 0.065),
    ]:
        d.ellipse(
            (
                int(size * (bx - brx)),
                int(size * (by - bry)),
                int(size * (bx + brx)),
                int(size * (by + bry)),
            ),
            fill=(125, 70, 28, 255),
            outline=outline,
            width=max(6, w - 6),
        )

    # legs
    for x in [0.33, 0.43, 0.57, 0.67]:
        _outline(
            d,
            "rounded_rectangle",
            (int(size * (x - 0.055)), int(size * 0.70), int(size * (x + 0.055)), int(size * 0.90)),
            fill=body2,
            outline=outline,
            width=w,
        )
    # paws
    for x in [0.33, 0.43, 0.57, 0.67]:
        _outline(
            d,
            "ellipse",
            (int(size * (x - 0.065)), int(size * 0.88), int(size * (x + 0.065)), int(size * 0.95)),
            fill=(92, 52, 23, 255),
            outline=outline,
            width=max(6, w - 2),
        )

    # head
    _outline(
        d,
        "ellipse",
        (int(size * 0.26), int(size * 0.12), int(size * 0.74), int(size * 0.56)),
        fill=body,
        outline=outline,
        width=w,
    )

    # ears
    _outline(
        d,
        "ellipse",
        (int(size * 0.14), int(size * 0.10), int(size * 0.33), int(size * 0.46)),
        fill=ear,
        outline=outline,
        width=w,
    )
    _outline(
        d,
        "ellipse",
        (int(size * 0.67), int(size * 0.10), int(size * 0.86), int(size * 0.46)),
        fill=ear,
        outline=outline,
        width=w,
    )
    _soft_highlight(img, (int(size * 0.16), int(size * 0.14), int(size * 0.26), int(size * 0.34)), opacity=55)
    _soft_highlight(img, (int(size * 0.74), int(size * 0.14), int(size * 0.84), int(size * 0.34)), opacity=55)

    # muzzle
    _outline(
        d,
        "ellipse",
        (int(size * 0.33), int(size * 0.30), int(size * 0.67), int(size * 0.58)),
        fill=muzzle,
        outline=outline,
        width=w,
    )

    # eyes
    _eye(d, int(size * 0.42), int(size * 0.28), int(size * 0.060), pupil="round")
    _eye(d, int(size * 0.58), int(size * 0.28), int(size * 0.060), pupil="round")

    # eyebrows
    d.arc((int(size * 0.34), int(size * 0.20), int(size * 0.46), int(size * 0.32)), start=200, end=340, fill=(92, 52, 23, 255), width=max(6, w - 3))
    d.arc((int(size * 0.54), int(size * 0.20), int(size * 0.66), int(size * 0.32)), start=200, end=340, fill=(92, 52, 23, 255), width=max(6, w - 3))

    # nose
    d.ellipse((int(size * 0.47), int(size * 0.40), int(size * 0.53), int(size * 0.45)), fill=(0, 0, 0, 255))
    d.ellipse((int(size * 0.485), int(size * 0.41), int(size * 0.50), int(size * 0.425)), fill=(255, 255, 255, 160))

    # mouth + tongue
    d.line([(int(size * 0.50), int(size * 0.45)), (int(size * 0.50), int(size * 0.49))], fill=outline, width=max(6, w - 3))
    d.arc((int(size * 0.38), int(size * 0.46), int(size * 0.50), int(size * 0.58)), start=10, end=180, fill=outline, width=max(6, w - 3))
    d.arc((int(size * 0.50), int(size * 0.46), int(size * 0.62), int(size * 0.58)), start=0, end=170, fill=outline, width=max(6, w - 3))

    d.ellipse(
        (int(size * 0.47), int(size * 0.51), int(size * 0.53), int(size * 0.60)),
        fill=(255, 105, 180, 255),
        outline=outline,
        width=max(6, w - 3),
    )

    # keep edges crisp (no extra unsharp)
    return img


def draw_cat(size: int = 512) -> Image.Image:
    # Worksheet/clipart style: opaque white background, thick outlines, minimal shading.
    img = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    d = ImageDraw.Draw(img)

    outline = (0, 0, 0, 255)
    w = max(12, size // 32)

    orange = (255, 153, 51, 255)
    orange2 = (230, 115, 0, 255)
    cream = (255, 236, 205, 255)
    stripe = (180, 90, 20, 255)

    # tail (crisp)
    td_points = [
        (int(size * 0.70), int(size * 0.60)),
        (int(size * 0.86), int(size * 0.54)),
        (int(size * 0.92), int(size * 0.44)),
    ]
    d.line(td_points, fill=orange2, width=int(w * 2.2), joint="curve")
    d.line(td_points, fill=outline, width=int(w * 2.8), joint="curve")

    # body
    _outline(
        d,
        "ellipse",
        (int(size * 0.25), int(size * 0.46), int(size * 0.75), int(size * 0.80)),
        fill=orange,
        outline=outline,
        width=w,
    )

    # belly
    _outline(
        d,
        "ellipse",
        (int(size * 0.35), int(size * 0.58), int(size * 0.65), int(size * 0.80)),
        fill=cream,
        outline=outline,
        width=max(6, w - 2),
    )

    # stripes
    for bx, by, brx, bry, rot in [
        (0.36, 0.58, 0.06, 0.11, -20),
        (0.64, 0.60, 0.06, 0.11, 20),
        (0.48, 0.70, 0.07, 0.09, -10),
    ]:
        # crisp stripes
        layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ld = ImageDraw.Draw(layer)
        ld.ellipse(
            (
                int(size * (bx - brx)),
                int(size * (by - bry)),
                int(size * (bx + brx)),
                int(size * (by + bry)),
            ),
            fill=(stripe[0], stripe[1], stripe[2], 255),
            outline=outline,
            width=max(5, w - 6),
        )
        if rot:
            layer = layer.rotate(rot, resample=Image.Resampling.BICUBIC, center=(int(size * bx), int(size * by)))
        img.alpha_composite(layer)

    # legs
    for x in [0.36, 0.50, 0.64]:
        _outline(
            d,
            "rounded_rectangle",
            (int(size * (x - 0.050)), int(size * 0.70), int(size * (x + 0.050)), int(size * 0.90)),
            fill=orange2,
            outline=outline,
            width=w,
        )

    # paws + toe beans
    for x in [0.36, 0.50, 0.64]:
        _outline(
            d,
            "ellipse",
            (int(size * (x - 0.060)), int(size * 0.88), int(size * (x + 0.060)), int(size * 0.95)),
            fill=cream,
            outline=outline,
            width=max(6, w - 2),
        )
        d.ellipse((int(size * (x - 0.020)), int(size * 0.90), int(size * (x + 0.020)), int(size * 0.935)), fill=(255, 170, 200, 255))

    # head
    _outline(
        d,
        "ellipse",
        (int(size * 0.27), int(size * 0.14), int(size * 0.73), int(size * 0.58)),
        fill=orange,
        outline=outline,
        width=w,
    )

    # ears
    _outline(
        d,
        "polygon",
        [(int(size * 0.34), int(size * 0.23)), (int(size * 0.27), int(size * 0.08)), (int(size * 0.42), int(size * 0.17))],
        fill=orange2,
        outline=outline,
        width=w,
    )
    _outline(
        d,
        "polygon",
        [(int(size * 0.66), int(size * 0.23)), (int(size * 0.73), int(size * 0.08)), (int(size * 0.58), int(size * 0.17))],
        fill=orange2,
        outline=outline,
        width=w,
    )
    # inner ear
    d.polygon([(int(size * 0.34), int(size * 0.22)), (int(size * 0.295), int(size * 0.11)), (int(size * 0.41), int(size * 0.18))], fill=(255, 180, 200, 255))
    d.polygon([(int(size * 0.66), int(size * 0.22)), (int(size * 0.705), int(size * 0.11)), (int(size * 0.59), int(size * 0.18))], fill=(255, 180, 200, 255))

    # cheek fluff
    _outline(d, "ellipse", (int(size * 0.18), int(size * 0.30), int(size * 0.36), int(size * 0.50)), fill=orange2, outline=outline, width=w)
    _outline(d, "ellipse", (int(size * 0.64), int(size * 0.30), int(size * 0.82), int(size * 0.50)), fill=orange2, outline=outline, width=w)

    # forehead stripes
    d.arc((int(size * 0.40), int(size * 0.16), int(size * 0.50), int(size * 0.28)), start=210, end=340, fill=stripe, width=max(6, w - 3))
    d.arc((int(size * 0.50), int(size * 0.16), int(size * 0.60), int(size * 0.28)), start=200, end=330, fill=stripe, width=max(6, w - 3))
    d.arc((int(size * 0.45), int(size * 0.10), int(size * 0.55), int(size * 0.24)), start=200, end=330, fill=stripe, width=max(5, w - 4))

    # eyes (cat slit pupils)
    _eye(d, int(size * 0.42), int(size * 0.30), int(size * 0.060), pupil="slit")
    _eye(d, int(size * 0.58), int(size * 0.30), int(size * 0.060), pupil="slit")

    # muzzle + nose
    _outline(d, "ellipse", (int(size * 0.38), int(size * 0.34), int(size * 0.62), int(size * 0.56)), fill=(255, 255, 255, 240), outline=outline, width=max(6, w - 2))
    d.polygon(
        [(int(size * 0.50), int(size * 0.40)), (int(size * 0.47), int(size * 0.44)), (int(size * 0.53), int(size * 0.44))],
        fill=(255, 160, 200, 255),
        outline=outline,
    )
    d.ellipse((int(size * 0.49), int(size * 0.405), int(size * 0.505), int(size * 0.42)), fill=(255, 255, 255, 180))

    # mouth
    d.line([(int(size * 0.50), int(size * 0.44)), (int(size * 0.50), int(size * 0.47))], fill=outline, width=max(6, w - 3))
    d.arc((int(size * 0.44), int(size * 0.44), int(size * 0.50), int(size * 0.52)), start=10, end=180, fill=outline, width=max(6, w - 3))
    d.arc((int(size * 0.50), int(size * 0.44), int(size * 0.56), int(size * 0.52)), start=0, end=170, fill=outline, width=max(6, w - 3))

    # whiskers
    for dy in [-0.02, 0.00, 0.02]:
        y = int(size * (0.43 + dy))
        d.line([(int(size * 0.32), y), (int(size * 0.08), y - int(size * 0.02))], fill=outline, width=max(4, w - 5))
        d.line([(int(size * 0.68), y), (int(size * 0.92), y - int(size * 0.02))], fill=outline, width=max(4, w - 5))

    return img


def save_png_and_jpg(img: Image.Image, png_path: Path, jpg_path: Path) -> None:
    png_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(png_path, "PNG", optimize=True)

    # JPEG (white background)
    bg = Image.new("RGB", img.size, (255, 255, 255))
    bg.paste(img, mask=img.split()[-1])
    bg.save(jpg_path, "JPEG", quality=92, optimize=True, progressive=True)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    dog = draw_dog(512)
    cat = draw_cat(512)

    save_png_and_jpg(dog, OUT_DIR / "dog.png", OUT_DIR / "dog.jpg")
    save_png_and_jpg(cat, OUT_DIR / "cat.png", OUT_DIR / "cat.jpg")

    print(f"✅ Generated: {OUT_DIR / 'dog.png'}")
    print(f"✅ Generated: {OUT_DIR / 'cat.png'}")


if __name__ == "__main__":
    main()
