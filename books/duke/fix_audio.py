"""Clean a chapter of the Duke audio: the title music, the YouTube chime and its mouse click. See NOTES.md.

    .venv/Scripts/python books/duke/fix_audio.py SRC DST [--cut A B] [--chime A B] [--click A B]

All times are seconds in SRC.
  --cut A B    remove A..B (the title music) and put --gap seconds of silence there (default 0.5), with 10 ms fades
  --chime A B  narrow notches at the chime's tones between A and B
  --click A B  keep only the sound under 3.5 kHz between A and B
The chime and click windows blend in with short fades, so the change makes no click of its own.
Writes one MP3 at 224 kbps, so the audio gets only one more lossy encode. Run it before transcribe.py.
"""
import argparse
import subprocess

import numpy as np

SR = 48000
TONES = [2689, 2774, 6480, 7600, 8338, 8724, 12332, 13100, 14800, 16400, 16720, 17900]
NOTCH = ",".join(f"bandreject=f={f}:width_type=q:w=25" for f in TONES for _ in range(2))


def pcm(src, filters=None):
    args = ["-af", filters] if filters else []
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, *args, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2)


def window(n, start, end, fade):
    m = np.zeros(n, np.float32)
    a, b, r = int(start * SR), int(end * SR), int(fade * SR)
    m[a:b] = 1
    m[a:a + r] = np.linspace(0, 1, r)
    m[b - r:b] = np.linspace(1, 0, r)
    return m[:, None]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("src")
    parser.add_argument("dst")
    parser.add_argument("--cut", type=float, nargs=2)
    parser.add_argument("--gap", type=float, default=0.5)
    parser.add_argument("--chime", type=float, nargs=2)
    parser.add_argument("--click", type=float, nargs=2)
    args = parser.parse_args()

    out = pcm(args.src)
    if args.chime:
        m = window(len(out), *args.chime, 0.015)
        out = out * (1 - m) + pcm(args.src, NOTCH) * m
    if args.click:
        m = window(len(out), *args.click, 0.004)
        out = out * (1 - m) + pcm(args.src, NOTCH + ",lowpass=f=3500,lowpass=f=3500,lowpass=f=3500") * m
    if args.cut:
        a, b, r = int(args.cut[0] * SR), int(args.cut[1] * SR), int(0.01 * SR)
        head, tail = out[:a].copy(), out[b:].copy()
        head[-r:] *= np.linspace(1, 0, r)[:, None]
        tail[:r] *= np.linspace(0, 1, r)[:, None]
        out = np.concatenate([head, np.zeros((int(args.gap * SR), 2), np.float32), tail])
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ac", "2", "-ar", str(SR), "-i", "-",
                    "-c:a", "libmp3lame", "-b:a", "224k", args.dst], input=out.astype(np.float32).tobytes(), check=True)


if __name__ == "__main__":
    main()
