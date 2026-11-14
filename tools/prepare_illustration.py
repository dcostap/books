"""Recover grayscale artwork and soft alpha from a magenta background."""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image


def prepare(image, crop_bottom=0, margin=20):
    """Return grayscale RGBA for cutout mode. The sampled margins must contain only magenta."""
    if crop_bottom < 0 or crop_bottom >= image.height:
        raise ValueError("Bottom crop must leave some image rows")
    image = image.convert("RGB").crop((0, 0, image.width, image.height - crop_bottom))
    w, h = image.size
    if margin < 1 or min(w, h) <= 2 * margin:
        raise ValueError("Image must be larger than twice the sampling margin")
    c = np.asarray(image, dtype=np.float64) / 255
    y, x = np.mgrid[-1:1:complex(h), -1:1:complex(w)]
    basis = np.stack([np.ones_like(x), x, y, x*y, x*x, y*y], axis=-1)
    border = np.zeros((h, w), dtype=bool)
    border[:margin] = True
    border[:, :margin] = True
    border[:, -margin:] = True
    samples = c[border]
    if not np.all((samples[:, 0] - samples[:, 1] > 0.2) & (samples[:, 2] - samples[:, 1] > 0.2)):
        raise ValueError("Top and side sampling margins must contain only a strong magenta background")
    # Fit the generated background's slight spatial color variation.
    key = np.clip(basis @ np.linalg.lstsq(basis[border], samples, rcond=None)[0], 0, 1)
    # C = q*(1,1,1) + t*K, where t is background coverage and q = alpha*gray.
    d = np.stack([c[..., 0]-c[..., 1], c[..., 2]-c[..., 1]], axis=-1)
    kd = np.stack([key[..., 0]-key[..., 1], key[..., 2]-key[..., 1]], axis=-1)
    denominator = np.sum(kd*kd, axis=-1)
    if np.any(denominator < 0.01):
        raise ValueError("The fitted background has too little color for reliable separation")
    t = np.clip(np.sum(d*kd, axis=-1) / denominator, 0, 1)
    a = 1-t
    q = np.mean(c-t[..., None]*key, axis=-1)
    gray = np.clip(q / np.maximum(a, 1e-6), 0, 1)
    # Suppress low-level matte noise without making the brush edge a hard cut.
    alpha = np.clip((a-0.04)/0.96, 0, 1)
    alpha[:margin] = 0
    alpha[:, :margin] = 0
    alpha[:, -margin:] = 0
    rgb = np.repeat(np.rint(gray*255).astype(np.uint8)[..., None], 3, axis=-1)
    rgba = np.dstack([rgb, np.rint(alpha*255).astype(np.uint8)])
    rgba[rgba[..., 3] == 0, :3] = 0
    bounds = Image.fromarray(np.where(rgba[..., 3] > 8, 255, 0).astype(np.uint8)).getbbox()
    if bounds is None:
        raise ValueError("No artwork remains after background removal")
    left, top, right, bottom = bounds
    box = (max(0, left-16), max(0, top-16), min(w, right+16), min(h, bottom+16))
    return Image.fromarray(rgba).crop(box)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path, help="New PNG path; existing files are never overwritten")
    parser.add_argument("--crop-bottom", type=int, default=0, metavar="PIXELS")
    parser.add_argument("--margin", type=int, default=20, metavar="PIXELS",
                        help="Clear magenta margin at the top and both sides (default: 20)")
    args = parser.parse_args()
    if args.output.exists():
        parser.error(f"Output already exists: {args.output}")
    with Image.open(args.source) as image:
        result = prepare(image, args.crop_bottom, args.margin)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("xb") as output:
        result.save(output, format="PNG", optimize=True)
    print(f"Saved {args.output}: {result.width} x {result.height}, grayscale RGBA")


if __name__ == "__main__":
    main()
