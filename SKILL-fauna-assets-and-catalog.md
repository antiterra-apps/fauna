## Skill: Fauna asset & catalog workflow

### Purpose

Help agents add and manage illustration assets for Fauna, enriching metadata with Claude and keeping `src/lib/catalog.ts` as the single source of truth.

### When to use this skill

- Adding **new illustrations** to the Engineer’s Manual collection.
- Regenerating **SVG/normalized** assets from originals.
- **Enriching** titles, descriptions, and tags with Claude.
- **Re-enriching** or correcting metadata for existing assets.

---

### 0. Prerequisites

- In repo root, `.env.local` must contain:

```bash
BLOB_READ_WRITE_TOKEN=...   # for Vercel Blob scripts
ANTHROPIC_API_KEY=...       # for Claude enrichment
```

- Dependencies installed:

```bash
npm install
```

---

### 1. Add a new Engineer’s Manual image

#### 1.1 Choose ID and filenames

- Asset IDs follow:

```text
engineers-manual-<N>   # e.g. engineers-manual-42
```

- Blob path/filename must match the existing pattern:

```text
Engineer's Manual/engineers-manual-42.png
```

- Extension can be `.png` / `.jpg` / `.jpeg` / `.webp`, but the **stem must be** `engineers-manual-42`.

#### 1.2 Upload to Vercel Blob

**Option A – Manual via Vercel dashboard**

- In Vercel project → Storage → Blobs:
  - Create or use folder: `Engineer's Manual/`
  - Upload file named: `engineers-manual-42.png`
  - Copy the resulting blob URL.

**Option B – Local images → Blob via script (batch)**

- Place local images under a folder, e.g.:

```text
./local-images/new/
```

- Run:

```bash
npm run process:local:images ./local-images/new
```

- Script: `scripts/process-local-images.ts`
  - Uses `BLOB_READ_WRITE_TOKEN`.
  - Assigns asset IDs `engineers-manual-5`, `engineers-manual-6`, … starting at 5.
  - Uploads originals to:

    ```text
    Engineer's Manual/engineers-manual-<N>.<ext>
    ```

  - Generates:
    - `assets/svg/engineers-manual-<N>.svg`
    - `assets/normalized/engineers-manual-<N>-1024.(svg|png|webp)`
  - Writes `processed-assets-metadata.json` with ready-to-use metadata.

**Note**: Because IDs are currently hard-coded to start at 5, this script is ideal for the *initial* bulk batch. For later additions where IDs are already in use, prefer manual naming (Option A) or adjust the script first.

---

### 2. Generate SVG + normalized images (if needed)

If you upload originals yourself (Option A), you still need SVG and normalized assets for new IDs.

#### 2.1 Generate missing SVGs

```bash
npm run regenerate:svgs:new-assets
```

- Script: `scripts/regenerate-svgs-for-new-assets.ts`
- Logic:
  - Looks at `collections` in `src/lib/catalog.ts`.
  - For each asset lacking `metadata.svgUrl`, generates an SVG from `imageUrl` and uploads:

    ```text
    assets/svg/engineers-manual-<N>.svg
    ```

#### 2.2 Generate normalized SVG/PNG/WebP

```bash
npm run regenerate:normalized:images
```

- Script: `scripts/regenerate-normalized-images.ts`
- For each asset with `metadata.svgUrl`, generates:

```text
assets/normalized/engineers-manual-<N>-1024.svg
assets/normalized/engineers-manual-<N>-1024.png
assets/normalized/engineers-manual-<N>-1024.webp
```

- Updates `metadata.normalizedSvgUrl`, `metadata.normalizedPngUrl`, `metadata.normalizedWebpUrl`.

---

### 3. Optional: regenerate catalog metadata JSON

```bash
npx tsx scripts/generate-catalog-metadata.ts
```

- Reads all relevant blobs via `@vercel/blob`.
- Writes `catalog-metadata.json`:

```json
{
  "id": "engineers-manual-42",
  "title": "Asset 42",
  "imageUrl": "...engineers-manual-42.png",
  "isFree": true,
  "collectionId": "engineers-manual",
  "description": "",
  "tags": [],
  "relatedAssets": [],
  "metadata": {
    "blobUrl": "...engineers-manual-42.png",
    "svgUrl": ".../assets/svg/engineers-manual-42.svg",
    "normalizedSvgUrl": ".../assets/normalized/engineers-manual-42-1024.svg",
    "normalizedPngUrl": ".../assets/normalized/engineers-manual-42-1024.png",
    "normalizedWebpUrl": ".../assets/normalized/engineers-manual-42-1024.webp"
  }
}
```

Use this as a helper reference for updating `src/lib/catalog.ts`; it is not read at runtime.

---

### 4. Update the TypeScript catalog (`src/lib/catalog.ts`)

1. Open `src/lib/catalog.ts`.
2. In the `engineersManualAssets: Asset[]` array, add or update the entry for the new ID, for example:

```ts
{
  id: 'engineers-manual-42',
  title: 'Asset 42',
  imageUrl: 'https://.../Engineer%27s%20Manual/engineers-manual-42.png',
  isFree: true,
  collectionId: 'engineers-manual',
  description: '',
  tags: [],
  relatedAssets: [],
  metadata: {
    blobUrl: 'https://.../Engineer%27s%20Manual/engineers-manual-42.png',
    svgUrl: 'https://.../assets/svg/engineers-manual-42.svg',
    normalizedSvgUrl: 'https://.../assets/normalized/engineers-manual-42-1024.svg',
    normalizedPngUrl: 'https://.../assets/normalized/engineers-manual-42-1024.png',
    normalizedWebpUrl: 'https://.../assets/normalized/engineers-manual-42-1024.webp',
  },
}
```

- It’s OK if `title`/`description`/`tags` are blank or simple placeholders; enrichment will overwrite them.

**Source-of-truth rule**: `src/lib/catalog.ts` is canonical for the app and API. All JSON files are intermediate artifacts.

---

### 5. Enrich metadata with Claude

```bash
npm run enrich
```

- Script: `scripts/enrich-catalog.ts`.
- For each asset:
  - Skips if:
    - `asset.id` already exists in `scripts/catalog-enriched.json`, or
    - `asset.tags` already contains at least one **use-case** tag:
      - `hero-section`, `about-page`, `pull-quote`, `section-divider`, `sidebar`, `footer`, `testimonial`, `feature-block`.
  - Otherwise:
    - Fetches `metadata.normalizedWebpUrl`.
    - Sends the image to Claude (`claude-sonnet-4-6`) with the Fauna style system prompt.
    - Writes result into `scripts/catalog-enriched.json`:

```json
"engineers-manual-42": {
  "title": "Nice Editorial Title",
  "description": "1–2 sentence description...",
  "tags": [
    "subject-tag",
    "mood-tag",
    "composition-tag",
    "hero-section"
  ]
}
```

- Logs like:

```text
✓ engineers-manual-42: Nice Editorial Title
```

- **Resumable**: rerunning will skip any IDs that already exist in `catalog-enriched.json`.

---

### 6. Merge enriched data into `src/lib/catalog.ts`

#### 6.1 Generate merged catalog file

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/merge-catalog-enriched.ts
```

- Reads:
  - `src/lib/catalog.ts`
  - `scripts/catalog-enriched.json`
- Writes:
  - `src/lib/catalog.merged.ts`
- For each asset whose `id` is in `catalog-enriched.json`:
  - Replace `title` with enriched `title`.
  - Replace `description` with enriched `description`.
  - Replace `tags` with enriched `tags`.
- Leaves `imageUrl`, `isFree`, and `metadata.*` as-is.

#### 6.2 Manual apply step (current behavior)

- Review `src/lib/catalog.merged.ts` (diff vs `src/lib/catalog.ts`).
- Once satisfied:
  - Either copy the updated `engineersManualAssets` section into `src/lib/catalog.ts`, or
  - Replace the file entirely if you’re okay with the formatting.
- **Intentional fragility**: this manual step is a safety rail. If you later want a fully automated workflow, adjust `merge-catalog-enriched.ts` to write directly to `catalog.ts` after a confirmation prompt.

#### 6.3 Run tests

```bash
npm test
```

- Confirms all API and search tests still pass with the enriched catalog.

---

### 7. Re-enriching / correcting an asset

If you want to change the AI-generated metadata for a specific asset:

1. Remove that asset’s entry from `scripts/catalog-enriched.json`.
2. Re-run enrichment and merge:

```bash
npm run enrich
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/merge-catalog-enriched.ts
```

3. Re-apply changes from `catalog.merged.ts` into `src/lib/catalog.ts` as above.

---

### 8. Quick cheat sheet

- **Source of truth**: `src/lib/catalog.ts`
- **Scripts**:
  - `npm run process:local:images ./dir` → local images → blob + SVG + normalized + `processed-assets-metadata.json` (IDs start at 5).
  - `npm run regenerate:svgs:new-assets` → missing SVGs from existing `imageUrl`s.
  - `npm run regenerate:normalized:images` → normalized 1024×1024 SVG/PNG/WebP.
  - `npx tsx scripts/generate-catalog-metadata.ts` → `catalog-metadata.json` snapshot from blob.
  - `npm run enrich` → `scripts/catalog-enriched.json` via Claude.
  - `npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/merge-catalog-enriched.ts` → `src/lib/catalog.merged.ts` (enriched fields applied).

- **Intermediate artifacts**:
  - `processed-assets-metadata.json`
  - `catalog-metadata.json`
  - `scripts/catalog-enriched.json`

