# Image-01 UI Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a front-end-ready high-fidelity UI asset sample package from `docs/image-01.png` and append implementable `375px`-based UI rules to the existing design document.

**Architecture:** Keep responsive text, containers, spacing, borders, and shadows in CSS guidance. Generate or redraw only complex raster visuals and reusable icons. Use a deterministic PowerShell build script for reference crops and the contact sheet so the package can be regenerated and checked consistently.

**Tech Stack:** Markdown, PowerShell, System.Drawing, SVG, PNG, built-in `image_gen`

---

## File Structure

Create or modify these files:

```text
docs/极饿时代-UI设计说明文档-2026-05-31.md
docs/ui-assets/image-01/README.md
docs/ui-assets/image-01/generated/paper-texture.png
docs/ui-assets/image-01/generated/black-paper-texture.png
docs/ui-assets/image-01/generated/red-ink-splash.png
docs/ui-assets/image-01/generated/red-stamp-base.png
docs/ui-assets/image-01/generated/chef-hero-print.png
docs/ui-assets/image-01/generated/chef-retreat-print.png
docs/ui-assets/image-01/icons/menu.svg
docs/ui-assets/image-01/icons/close.svg
docs/ui-assets/image-01/icons/remove.svg
docs/ui-assets/image-01/icons/arrow-up.svg
docs/ui-assets/image-01/icons/chevron-up.svg
docs/ui-assets/image-01/reference-crops/dish-spicy-chicken.png
docs/ui-assets/image-01/reference-crops/dish-lemon-chicken.png
docs/ui-assets/image-01/reference-crops/dish-fish-pork.png
docs/ui-assets/image-01/reference-crops/dish-tomato-egg.png
docs/ui-assets/image-01/reference-crops/dish-dry-pot-beans.png
docs/ui-assets/image-01/reference-crops/stamp-reference.png
docs/ui-assets/image-01/reference-crops/banner-reference.png
docs/ui-assets/image-01/contact-sheet.png
scripts/build-image-01-reference-assets.ps1
```

Responsibilities:

- `scripts/build-image-01-reference-assets.ps1`: crop reference regions from the source composite and generate a deterministic contact sheet.
- `docs/ui-assets/image-01/generated/`: project-bound generated PNG assets.
- `docs/ui-assets/image-01/icons/`: code-native SVG icons.
- `docs/ui-assets/image-01/reference-crops/`: reference-only crop output.
- `docs/ui-assets/image-01/README.md`: asset index and integration notes.
- `docs/极饿时代-UI设计说明文档-2026-05-31.md`: implementation rules derived from the visual sample.

### Task 1: Add Deterministic Reference Asset Builder

**Files:**
- Create: `scripts/build-image-01-reference-assets.ps1`
- Create: `docs/ui-assets/image-01/reference-crops/*.png`

- [ ] **Step 1: Add the PowerShell crop and contact-sheet builder**

Use `System.Drawing.Bitmap.Clone()` with explicit rectangles for the five menu thumbnails, the stamp reference, and the banner reference. Add a helper that writes `contact-sheet.png` after the generated assets and icons exist.

- [ ] **Step 2: Run the builder to generate reference crops**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-image-01-reference-assets.ps1
```

Expected: seven PNG files exist under `docs/ui-assets/image-01/reference-crops/`, and each file has non-zero width and height.

- [ ] **Step 3: Inspect the reference crops**

Run:

```powershell
Get-ChildItem .\docs\ui-assets\image-01\reference-crops\*.png | Select-Object Name,Length
```

Expected: all seven files have a positive byte length. Visually inspect the dish thumbnails and references.

### Task 2: Redraw Code-Native SVG Icons

**Files:**
- Create: `docs/ui-assets/image-01/icons/menu.svg`
- Create: `docs/ui-assets/image-01/icons/close.svg`
- Create: `docs/ui-assets/image-01/icons/remove.svg`
- Create: `docs/ui-assets/image-01/icons/arrow-up.svg`
- Create: `docs/ui-assets/image-01/icons/chevron-up.svg`

- [ ] **Step 1: Add five SVG files**

Use `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`, `stroke-linecap="round"`, and `stroke-linejoin="round"`. Keep the geometry intentionally simple:

```svg
<!-- menu.svg -->
<path d="M5 7h14M5 12h14M5 17h14"/>

<!-- close.svg -->
<path d="M6 6l12 12M18 6L6 18"/>

<!-- remove.svg -->
<circle cx="12" cy="12" r="9"/>
<path d="M9 9l6 6M15 9l-6 6"/>

<!-- arrow-up.svg -->
<path d="M12 19V5M6 11l6-6 6 6"/>

<!-- chevron-up.svg -->
<path d="M7 14l5-5 5 5"/>
```

- [ ] **Step 2: Validate SVG structure**

Run:

```powershell
Get-ChildItem .\docs\ui-assets\image-01\icons\*.svg | ForEach-Object { [xml](Get-Content -Raw $_.FullName) | Out-Null; $_.Name }
```

Expected: all five SVG filenames print with no XML parser errors.

### Task 3: Generate High-Fidelity Raster Assets

**Files:**
- Create: `docs/ui-assets/image-01/generated/paper-texture.png`
- Create: `docs/ui-assets/image-01/generated/black-paper-texture.png`
- Create: `docs/ui-assets/image-01/generated/red-ink-splash.png`
- Create: `docs/ui-assets/image-01/generated/red-stamp-base.png`
- Create: `docs/ui-assets/image-01/generated/chef-hero-print.png`
- Create: `docs/ui-assets/image-01/generated/chef-retreat-print.png`

- [ ] **Step 1: Generate paper textures**

Use built-in `image_gen` with no embedded text, logos, devices, or UI:

```text
Use case: stylized-concept
Asset type: repeatable mobile UI background texture
Primary request: subtle warm rice-paper texture with restrained old-newsprint grain
Style/medium: scanned paper surface, natural fibers, light ink wear
Color palette: warm off-white, muted beige, faint gray-brown speckles
Constraints: flat evenly lit texture, no text, no drawings, no border, no watermark, suitable for seamless-looking CSS background use
Avoid: strong stains, torn edges, gradients, shadows, red marks, chili imagery
```

Generate the dark variant with matte charcoal-black paper and restrained gray fibers.

- [ ] **Step 2: Generate ink and stamp assets**

Use built-in `image_gen` for a red ink splash and a circular red stamp base. Ask for a flat removable `#00ff00` chroma-key background, then remove it locally with:

```powershell
python "$env:USERPROFILE\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py" --input <source> --out <final.png> --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill
```

Constraints: dark oxblood ink, no text, no chili imagery, no watermark.

- [ ] **Step 3: Generate hero chef print**

Use built-in `image_gen` with a flat removable `#00ff00` chroma-key background:

```text
Use case: stylized-concept
Asset type: mobile landing-page hero illustration
Primary request: an original black-and-white woodcut-style illustration of an intense home chef shouting with energy, waist-up, one hand pointing upward, martial-arts poster attitude
Style/medium: rough Chinese printmaking, dry-brush ink, vintage kitchen poster, bold high-contrast black linework
Composition/framing: centered character with generous edge padding, isolated subject
Color palette: black ink and small restrained dark oxblood accents only
Constraints: perfectly flat solid #00ff00 background for removal; no text; no logos; no watermark; no device frame; no chili imagery; no weapons; original character design
```

Remove chroma key locally and validate transparent corners.

- [ ] **Step 4: Generate retreat chef print**

Use built-in `image_gen` with a flat removable `#00ff00` chroma-key background:

```text
Use case: stylized-concept
Asset type: mobile closed-state illustration
Primary request: an original black-and-white woodcut-style illustration of a home chef seen from behind at a kitchen counter, wearing a tied headband and dark jacket, surrounded by bowls, quiet closing-time mood
Style/medium: rough Chinese printmaking, dry-brush ink, vintage kitchen poster, bold high-contrast black linework
Composition/framing: centered back-facing character, lower-half kitchen counter, generous edge padding
Color palette: black ink and small restrained dark oxblood accents only
Constraints: perfectly flat solid #00ff00 background for removal; no text; no logos; no watermark; no device frame; no chili imagery; original character design
```

Remove chroma key locally and validate transparent corners.

- [ ] **Step 5: Validate raster assets**

Run:

```powershell
Add-Type -AssemblyName System.Drawing
Get-ChildItem .\docs\ui-assets\image-01\generated\*.png | ForEach-Object {
  $img = [System.Drawing.Bitmap]::FromFile($_.FullName)
  "$($_.Name) $($img.Width)x$($img.Height) format=$($img.PixelFormat)"
  $img.Dispose()
}
```

Expected: six PNG files print with non-zero dimensions. Transparent assets report an alpha-capable pixel format and have visually clean edges.

### Task 4: Append Implementable UI Rules

**Files:**
- Modify: `docs/极饿时代-UI设计说明文档-2026-05-31.md`

- [ ] **Step 1: Append the image-01 high-fidelity section**

Add a new section containing:

- `375px` baseline layout dimensions
- font stacks, font sizes, weights, and line heights
- color tokens with HEX and RGB values
- border radii, outlines, and shadows
- `4px` spacing system and safe-area rules
- responsive breakpoints for `320-359px`, `360-389px`, `390-429px`, and `430px+`
- page-specific rules for opening, menu, drawer, form modal, and retreat screens
- CSS/text/SVG/PNG responsibility boundaries

- [ ] **Step 2: Check required topics**

Run:

```powershell
rg -n "375px|字体|字号|行高|色值|阴影|圆角|间距|320-359px|360-389px|390-429px|430px\\+" .\docs\极饿时代-UI设计说明文档-2026-05-31.md
```

Expected: every required topic is present in the appended section.

### Task 5: Add Asset Index and Contact Sheet

**Files:**
- Create: `docs/ui-assets/image-01/README.md`
- Create: `docs/ui-assets/image-01/contact-sheet.png`
- Modify: `scripts/build-image-01-reference-assets.ps1`

- [ ] **Step 1: Write the asset index**

For every PNG and SVG, record filename, type, purpose, suggested size, background mode, integration method, status, and notes. Mark reference crops as reference-only.

- [ ] **Step 2: Generate contact sheet**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-image-01-reference-assets.ps1 -BuildContactSheet
```

Expected: `docs/ui-assets/image-01/contact-sheet.png` exists and presents generated PNGs, SVG icon labels, and reference crops in grouped rows.

- [ ] **Step 3: Inspect the contact sheet**

Open `docs/ui-assets/image-01/contact-sheet.png` with the local image viewer and confirm:

- all requested assets appear
- transparent assets do not show obvious green fringe
- generated visuals are stylistically consistent
- reference-only crops are clearly separated

### Task 6: Verify and Commit

**Files:**
- Verify all files listed above

- [ ] **Step 1: Run package verification**

Run:

```powershell
$expected = @(
  'docs/ui-assets/image-01/README.md',
  'docs/ui-assets/image-01/contact-sheet.png',
  'docs/ui-assets/image-01/generated/paper-texture.png',
  'docs/ui-assets/image-01/generated/black-paper-texture.png',
  'docs/ui-assets/image-01/generated/red-ink-splash.png',
  'docs/ui-assets/image-01/generated/red-stamp-base.png',
  'docs/ui-assets/image-01/generated/chef-hero-print.png',
  'docs/ui-assets/image-01/generated/chef-retreat-print.png',
  'docs/ui-assets/image-01/icons/menu.svg',
  'docs/ui-assets/image-01/icons/close.svg',
  'docs/ui-assets/image-01/icons/remove.svg',
  'docs/ui-assets/image-01/icons/arrow-up.svg',
  'docs/ui-assets/image-01/icons/chevron-up.svg'
)
$missing = $expected | Where-Object { -not (Test-Path $_) }
if ($missing) { throw "Missing assets: $($missing -join ', ')" }
```

Expected: command exits successfully with no missing assets.

- [ ] **Step 2: Review repository status**

Run:

```powershell
git status --short
```

Expected: only the intended UI document, script, and `docs/ui-assets/image-01/` package are changed, aside from pre-existing untracked source images.

- [ ] **Step 3: Commit the completed sample package**

Run:

```powershell
git add -- scripts/build-image-01-reference-assets.ps1 docs/ui-assets/image-01 docs/极饿时代-UI设计说明文档-2026-05-31.md
git commit -m "docs: add image-01 high fidelity ui asset sample"
```
