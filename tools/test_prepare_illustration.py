"""Checks for grayscale artwork recovered from a magenta background."""
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

import numpy as np
from PIL import Image

from prepare_illustration import prepare


def sample():
    image = np.full((100, 120, 3), (230, 20, 245), dtype=np.uint8)
    image[30:70, 40:80] = 128
    image[30:70, 35:40] = np.rint(0.5 * np.array([230, 20, 245]) + 0.5 * 160)
    return Image.fromarray(image)


class PreparationTests(unittest.TestCase):
    def test_chapter_one_reproduces_approved_pixels(self):
        pictures = Path(__file__).resolve().parents[1] / "books/hp1/pictures"
        with Image.open(pictures / "raw/01-1.png") as source:
            result = prepare(source, crop_bottom=18)
        with Image.open(pictures / "01-1.png") as approved:
            np.testing.assert_array_equal(np.asarray(result), np.asarray(approved))

    def test_preserves_gray_and_recovers_partial_edges(self):
        pixels = np.asarray(prepare(sample()))
        alpha = pixels[..., 3]
        self.assertTrue(np.any(alpha == 0))
        self.assertTrue(np.any(alpha == 255))
        self.assertTrue(np.all(pixels[..., 0] == pixels[..., 1]))
        self.assertTrue(np.all(pixels[..., 1] == pixels[..., 2]))
        self.assertTrue(np.all(pixels[alpha == 0, :3] == 0))
        self.assertTrue(np.all(np.abs(pixels[alpha == 255, 0].astype(int) - 128) <= 1))
        soft = pixels[(alpha > 0) & (alpha < 255)]
        self.assertGreater(len(soft), 0)
        self.assertTrue(np.all(np.abs(soft[:, 0].astype(int) - 160) <= 2))
        self.assertTrue(np.all((soft[:, 3] >= 119) & (soft[:, 3] <= 125)))

    def test_bottom_crop_removes_detached_strip(self):
        image = sample()
        pixels = np.asarray(image).copy()
        pixels[-4:] = 128
        result = prepare(Image.fromarray(pixels), crop_bottom=4)
        expected = prepare(image.crop((0, 0, image.width, image.height - 4)))
        np.testing.assert_array_equal(np.asarray(result), np.asarray(expected))
        with self.assertRaisesRegex(ValueError, "sampling margins"):
            prepare(Image.fromarray(pixels))

    def test_rejects_missing_key_and_empty_art(self):
        with self.assertRaisesRegex(ValueError, "sampling margins"):
            prepare(Image.new("RGB", (100, 100), "gray"))
        with self.assertRaisesRegex(ValueError, "No artwork"):
            prepare(Image.new("RGB", (100, 100), (230, 20, 245)))

    def test_rejects_invalid_dimensions(self):
        for kwargs in ({"crop_bottom": -1}, {"crop_bottom": 100}, {"margin": 0}, {"margin": 60}):
            with self.subTest(kwargs=kwargs), self.assertRaises(ValueError):
                prepare(sample(), **kwargs)

    def test_cli_does_not_overwrite(self):
        with tempfile.TemporaryDirectory() as directory:
            source, output = Path(directory) / "source.png", Path(directory) / "output.png"
            sample().save(source)
            output.write_bytes(b"keep this file")
            result = subprocess.run(
                [sys.executable, "-I", str(Path(__file__).with_name("prepare_illustration.py")),
                 str(source), str(output)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 2)
            self.assertIn("Output already exists", result.stderr)
            self.assertEqual(output.read_bytes(), b"keep this file")


if __name__ == "__main__":
    unittest.main()
