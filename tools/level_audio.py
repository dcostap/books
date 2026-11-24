"""Set chapter loudness at the final encode. See the README.

Usage: python tools/level_audio.py CLEAN_SOURCE CHAPTER.webm
"""

import argparse
import json
import math
import subprocess
import tempfile
from pathlib import Path

TARGET_LUFS = -20.0
TOLERANCE_LU = 0.5
MAX_DBTP = -1.5
MONO = "aformat=sample_fmts=fltp:channel_layouts=mono"


def measure(path):
    run = subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "info", "-nostdin", "-nostats", "-i", str(path), "-map", "0:a:0",
         "-af", f"{MONO},loudnorm=I={TARGET_LUFS}:TP={MAX_DBTP}:LRA=11:print_format=json", "-f", "null", "-"],
        check=True, capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    summary, _ = json.JSONDecoder().raw_decode(run.stderr[run.stderr.rfind("{"):])
    return float(summary["input_i"]), float(summary["input_tp"])


def level(source, output):
    before, peak = measure(source)
    if not math.isfinite(peak) or before <= -70:
        raise ValueError(f"No measurable speech in {source}")
    gain = TARGET_LUFS - before
    ceiling = -3.0  # Leave room for peaks that the Opus encode can add.
    with tempfile.TemporaryDirectory(dir=output.parent) as tmp:
        trial = Path(tmp) / output.name
        for _ in range(3):
            limit = 10 ** (ceiling / 20)
            filters = (f"{MONO},volume={gain:.2f}dB,aresample=192000,"
                       f"alimiter=limit={limit:.6f}:attack=5:release=50:level=0:latency=1,aresample=48000")
            subprocess.run(
                ["ffmpeg", "-v", "error", "-nostdin", "-y", "-i", str(source), "-map", "0:a:0",
                 "-af", filters, "-c:a", "libopus", "-b:a", "24k", str(trial)], check=True,
            )
            after, out_peak = measure(trial)
            error = TARGET_LUFS - after
            if abs(error) <= TOLERANCE_LU and out_peak <= MAX_DBTP:
                trial.rename(output)
                print(f"{output.name}: {before:.1f} to {after:.1f} LUFS, {peak:.1f} to {out_peak:.1f} dBTP")
                return
            # Start again from the clean source, never from the trial encode.
            gain += error
            if out_peak > MAX_DBTP:
                ceiling -= out_peak - MAX_DBTP + 0.2
        raise ValueError(f"Outside limits: {after:.1f} LUFS, {out_peak:.1f} dBTP")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if args.output.suffix != ".webm" or args.output.exists():
        parser.error("output must be a new .webm file")
    try:
        level(args.source, args.output)
    except (OSError, ValueError, subprocess.CalledProcessError) as err:
        parser.exit(1, f"{args.source}: {err}\n")


if __name__ == "__main__":
    main()
