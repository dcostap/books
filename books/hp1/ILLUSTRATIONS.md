# HP illustrations: orchestrator guide

Use this guide with [NOTES.md](NOTES.md). It records the chapter 1 method and the user's approved appearance. Keep scene details specific to each chapter.

## Scope and ownership

The orchestrator handles image prompts, source files, processing, placement, builds, and browser checks. Do not let translation reviewers change these files during their assigned reviews.

This treatment applies to HP. Do not change the Sherlock Holmes pictures in `books/duke`. They retain their existing ink masks and rectangular paper backgrounds in dark themes.

Keep the original generated image. Save processing results separately. Do not push without the user's approval.

Use this recipe when the user authorizes another illustration. Record the model version, prompt, negative prompt, seed, dimensions, and settings when available. Do not invent missing generation details.

## What happened in chapter 1

The assistant supplied an image prompt and a magenta-background addendum. The user generated the image outside this project and supplied `kromoss_04321_98520.0.png`. The model, seed, sampler, guidance, and exact submitted prompt were not reported. Do not infer them from the filename.

The scene shows Dumbledore seated on the garden wall beside the tabby cat. It appears after he sits down, before «Fancy seeing you here, Professor McGonagall.» The picture has no caption and reveals no later transformation.

The user approved the drawing and its existing brush-edge outline. The user then approved clipping the dark-theme paper to that outline. Do not replace it with a rectangle or invent another border.

The output did not follow every prompt instruction. It was portrait, with round glasses, a cap, a wand, and an apparently lit streetlamp. The user kept this result. These are not new rules for future scenes. Check future images against the English text before accepting them.

| File | Purpose |
|---|---|
| `pictures/raw/01-1.png` | Original supplied image, 1232 × 1696 pixels, with magenta background. |
| `pictures/01-1.png` | Prepared grayscale RGBA image, 1168 × 1654 pixels. RGB holds the drawing; alpha holds its outline. |
| `../../site/books/hp1/pictures/01-1-cutout.webp` | Generated ink-density mask. |
| `../../site/books/hp1/pictures/01-1-outline.webp` | Generated coverage mask for the drawing and themed paper. |

Paths in the first two rows are relative to this book. Site assets are generated; do not edit them directly.

## Choose the moment

1. Read the English around the proposed location.
2. Choose one clear action or quiet interaction, not a summary of the whole chapter.
3. Check clothing, props, lighting, location, and who is present.
4. Avoid later revelations, even in captions and accessible labels.
5. Place the picture after the paragraph that establishes its scene.
6. Prefer a simple composition that remains clear at about 350 pixels wide.

The chapter 1 contrast was a relaxed, faintly amused wizard beside a rigid, serious cat. This gave the drawing a clear subject without spell effects or spectacle.

## Reusable generation prompt

This consolidates the supplied prompt and its later border addendum. Replace the scene and character details for each new image. The magenta instructions replace the earlier request for a transparent or white background.

```text
Create an original illustration for an illustrated fantasy novel.

SCENE
A quiet British suburban street at night, in the early 1980s.
An elderly wizard sits on a low brick garden wall beside a watchful tabby cat.
This is Albus Dumbledore on Privet Drive, before the cat transforms.
He has just extinguished the streetlamps.
The moment feels still, mysterious, and gently humorous, rather than threatening.

CHARACTERS
Dumbledore is unusually tall and thin, with a very long silver beard and long silver hair.
His beard falls toward his waist.
He wears small half-moon spectacles, long robes, a sweeping cloak, and buckled boots.
His nose is long and crooked.
His expression is calm, thoughtful, and faintly amused.
Show an elderly face with character, rather than a handsome young wizard.
His posture is relaxed, with his body facing the street.
Keep his hands simple and anatomically clear.
He holds no wand.

The tabby cat sits very upright beside him.
Its front paws are together, and its tail rests close to its body.
Its rigid posture contrasts with Dumbledore's relaxed manner.
Its eyes look alert and slightly disapproving.
Give it clear tabby stripes and distinctive dark markings around its eyes.
The cat wears no spectacles, clothes, or accessories.
Keep its proportions recognizably feline.

COMPOSITION
Use a landscape composition, approximately 3:2.
View the wall and characters from a slightly angled, three-quarter position.
Place Dumbledore left of center and the cat on the right.
Both characters must remain clear when the image is reduced to a small reading illustration.
Keep their silhouettes separate.
Make their contrasting postures the main visual idea.
Show enough of the wall to establish where they sit.
Use only a few background details: a neat hedge, a garden path, and part of an ordinary suburban house.
Suggest a dark streetlamp farther away.
Avoid a deep, complicated street scene.

STYLE
Traditional monochrome pen-and-ink book illustration.
Use expressive, controlled linework, fine cross-hatching, and restrained gray ink washes.
Give the beard, cloak, brickwork, and cat distinct textures.
Keep the faces and central silhouettes clearer than the background.
Use strong shapes with delicate detail, rather than dense detail everywhere.
The result should feel warm, literary, and carefully drawn.
It must not resemble a film still, promotional poster, or game concept painting.

LIGHT AND ATMOSPHERE
Suggest nighttime through selective shadows and small highlights.
Keep the illustration readable without filling the background with solid black.
Use soft ambient light on the beard, spectacles, and the cat's face.
The streetlamps are unlit.
The cat's eyes may catch a small reflected highlight, but must not emit beams or magical light.
No visible spell effects are needed.

EDGES AND OUTPUT
Finish the illustration with an irregular ink-wash vignette edge.
Use dry-brush strokes, soft broken contours, and a few fine ink flecks.
Let some details extend beyond the main edge.
Avoid a uniform oval, hard rectangle, decorative frame, or drop shadow.
Keep the artwork black, white, and gray.
Surround it with a completely flat, vivid magenta background (#FF00FF).
Use magenta only as the removable background.
Do not add magenta lighting, reflections, or texture to the illustration.
Preserve white highlights and white areas inside the artwork.
Include no lettering, captions, logos, signatures, or watermarks.
```

For future runs, add: «Leave at least 40 pixels of untouched magenta around every edge of the canvas.» This protects the sampling margins used below.

If the model supports a negative prompt:

```text
photorealism, film still, cinematic poster, anime, cartoon mascot, glossy 3D rendering,
modern cars, smartphones, city skyline, castle, Hogwarts, medieval village,
pointed wizard hat, wand, spell beams, glowing eyes, magical particles,
human wearing cat ears, cat wearing glasses, extra characters, extra cats,
extra limbs, malformed hands, duplicate faces, tangled silhouettes,
dense background, solid black sky, heavy rectangular border,
paper texture covering the whole canvas, checkerboard background,
text, lettering, watermark, signature
```

The suggested size was 1536 × 1024, or a supported landscape size. The accepted portrait result was 1232 × 1696. Keep the accepted composition; do not crop it to landscape merely to match the prompt.

## Remove magenta and recover the soft edge

Use [prepare_illustration.py](../../tools/prepare_illustration.py). It needs the existing Pillow and NumPy dependencies. It writes a new PNG and refuses to overwrite an existing file.

This method assumes grayscale artwork over a strong magenta background. Do not use it for colored artwork. The top and both side sampling margins must contain only background. The default margin is 20 pixels. Inspect these areas before processing.

For a new image, start without a bottom crop:

```bash
.venv/Scripts/python -I tools/prepare_illustration.py books/hp1/pictures/raw/NN-K.png books/hp1/pictures/NN-K.png
```

For the exact chapter 1 result, write to a new temporary path:

```bash
.venv/Scripts/python -I tools/prepare_illustration.py books/hp1/pictures/raw/01-1.png "$TEMP/hp1-01-1-reproduced.png" --crop-bottom 18
```

The 18-pixel crop removes a detached strip at the bottom of this source image. Do not apply it automatically to future images. The remaining source height is 1678 pixels. The final crop box is `(41, 24, 1209, 1678)` within that image.

The script performs these steps:

1. Apply the requested bottom crop.
2. Sample the clear top and side margins.
3. Fit a smooth background color field, using `1, x, y, xy, x², y²` for each RGB channel.
4. Separate neutral gray artwork from the magenta background using channel differences.
5. Recover grayscale brightness and partial pixel coverage separately. This removes pink from mixed edge pixels.
6. Suppress background noise with `alpha = clip((coverage - 0.04) / 0.96, 0, 1)`.
7. Clear the sampled margins and set RGB to zero where alpha is zero.
8. Find artwork with alpha above `8/255`, then retain 16 pixels of padding around its bounds.
9. Save grayscale RGB plus the recovered alpha as an optimized PNG.

The separation uses `C = aF + (1-a)K`. Here, `C` is the input pixel, `K` the fitted background, and `F` neutral gray. Channel differences remove `F` from the equation and reveal background coverage. The remaining brightness then gives the grayscale artwork.

Run the processing checks after changing the script:

```bash
.venv/Scripts/python -m unittest discover -s tools -p 'test_prepare_illustration.py' -v
```

These checks include exact reproduction of the approved chapter 1 pixels, partial edge recovery, crop handling, and overwrite protection.

Do not delete only pixels equal to `#FF00FF`. Generated backgrounds vary, and brush edges mix artwork with magenta. A hard color replacement leaves a pink fringe or cuts off the brushwork.

Do not treat the recovered RGB as premultiplied alpha. The build needs separate grayscale brightness and coverage.

These thresholds reproduce chapter 1. Inspect every new result; unusually faint strokes or an uneven background can need different processing.

## Build the themed cutout

HP uses these book settings:

```json
"pictureColumn": 1232,
"pictureMode": "cutout"
```

`pictureColumn` is a sizing reference, not the export resolution. The existing width formula is `raw_width / pictureColumn * 22em`. The chapter also limits image height to 40vh. Review the result instead of changing this book-wide value for one new picture.

Keep both source files:

- `pictures/raw/NN-K.png`: untouched generator output. The build also reads its width.
- `pictures/NN-K.png`: prepared grayscale RGBA. This is the input for cutout rendering.

**Do not put a black-only ink mask in the prepared PNG slot.** Cutout mode reads grayscale RGB for ink density and alpha for the outer outline. A black-only input would produce a solid dark shape.

The build exports two WebP masks, at no more than 1000 pixels wide:

- `NN-K-cutout.webp`: black ink with alpha equal to `1 - grayscale`. Current settings are quality 80 and alpha quality 70.
- `NN-K-outline.webp`: the source coverage in alpha. Current settings are quality 80 and alpha quality 100.

The figure data includes the outline URL as `paper`. `setPicture()` applies it in both the chapter and enlarged viewer. CSS clips the whole picture to this outline, with no inset. The inner mask supplies ink density.

Apply coverage only once. Do not multiply ink density by the source alpha before the outer mask clips it. That would fade the brush edge twice.

Light themes retain their usual ink color and transparent paper. Dark themes retain muted paper `#b3a58e` and ink `#29251f`. The paper now follows the drawing's own edge, rather than filling a rectangle.

The default picture mode remains `ink`. Sherlock's assets and rendering do not change. Do not enable `cutout` for its existing black-only PNGs.

## Add the picture without changing narration

Add a standalone empty-caption figure after the scene's paragraph:

```markdown
![](NN-K)
```

Keep blank lines around it. For chapter 1, the marker comes before «Fancy seeing you here, Professor McGonagall.»

Do not change English prose, sentence IDs, translation jobs, word timings, or audio for an uncaptioned picture. Do not run transcription or retiming. If a caption is requested, follow the existing untimed-caption workflow and translate the added caption.

Build from the repository root:

```bash
PYTHONIOENCODING=utf-8 .venv/Scripts/python tools/build.py
.venv/Scripts/python -I tools/prepare_pwa.py
node --test tools/pwa.test.mjs
```

Do not use `-I` with `build.py`; it imports the sibling translation module. If the browser shows old assets, activate the offered update or reload without the old service-worker cache. Do not clear reading settings to refresh assets.

## Acceptance checks

- Compare the image with its English scene. Check props, faces, hands, lighting, and later-story information.
- Inspect the processed edge over both a light background and a dark background.
- Keep intended brush flecks. Remove detached strips and unwanted generation debris.
- Check for pink fringes, hard cut edges, lost highlights, and rectangular paper outside the outline.
- Test the chapter and enlarged viewer. Check zoom, closing, mobile layout, and browser diagnostics.
- Use the settings UI to check light and dark themes. Do not edit saved settings directly.
- Compare all English tokens and audio times with the preceding committed build. They must remain identical.
- Confirm that translation data stays unchanged and that the new figure has no timed sentences.
- Check that Sherlock's generated files remain unchanged.
- Run `git diff --check`. Commit only the accepted source, notes, code, and generated assets.

Chapter 1's integration checks passed at `94b37ae`, with 23 application tests. Its 4,675 English tokens, 343 entries, translations, and audio timings stayed unchanged. The prepared outline matched the resized source alpha exactly. The user approved the result in a dark theme. The scene differences listed above remain.
