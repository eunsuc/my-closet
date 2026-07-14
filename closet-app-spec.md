# Closet App — Build Spec

## Goal

A local-first PWA for cataloguing clothing items and building outfits by scrolling through them. Runs in the browser, installable to iOS home screen, works offline, no backend, no accounts, no AI features.

The user prepares images by hand using iOS's built-in "lift subject from background" (long-press an item in Photos → Copy/Share) and imports the resulting transparent PNGs. **The app does not do segmentation.**

---

## Scope for v1

**In scope**
- Import images from photo library (transparent PNGs expected, but handle any image)
- Tag each item with a category: `dress` | `shirt` | `skirt`
- Outfit builder: a scroll-through / slot-machine view that stacks a shirt over a skirt (or shows a dress full-length) so you can flip through combinations
- Save outfits, view saved outfits, delete them
- Everything persists locally across sessions

**Explicitly out of scope**
- Background removal / segmentation
- Any recommendation, suggestion, scoring, or "AI" feature
- Sync, accounts, sharing, cloud storage
- Color analysis, attributes beyond category
- Wear tracking

Do not add features beyond this list. If something seems like an obvious enhancement, leave it out.

---

## Stack

- **React 18 + TypeScript + Vite**
- **Dexie.js** (IndexedDB wrapper) for persistence
- **vite-plugin-pwa** for the manifest + service worker
- **Zustand** for app state (or React context — keep it simple)
- Plain CSS or CSS modules. No component library.

Target: iOS Safari, added to home screen. Mobile-first layout, ~390px viewport. Must work offline after first load.

---

## Data model

```ts
type Category = 'dress' | 'shirt' | 'skirt';

interface Item {
  id: string;              // uuid
  category: Category;
  image: Blob;             // the uploaded image, stored directly in IndexedDB
  thumbnail: Blob;         // downscaled, ~200px on long edge, for grid views
  name?: string;           // optional user label
  createdAt: number;       // Date.now()
}

interface Outfit {
  id: string;
  // Either a dress alone, or a shirt + skirt pair
  dressId?: string;
  shirtId?: string;
  skirtId?: string;
  name?: string;
  createdAt: number;
}
```

**Dexie schema**

```ts
db.version(1).stores({
  items: 'id, category, createdAt',
  outfits: 'id, createdAt',
});
```

Store `Blob`s directly — IndexedDB handles them natively, no base64 encoding. Generate object URLs with `URL.createObjectURL()` on render and **revoke them on unmount** to avoid leaking memory.

**Validity rule for an outfit:** either `dressId` is set (and shirt/skirt are not), or both `shirtId` and `skirtId` are set (and dress is not). Enforce this when saving.

---

## Screens

Three tabs at the bottom: **Closet**, **Build**, **Outfits**.

### 1. Closet

- Grid of all items, 3 columns, showing thumbnails.
- Filter chips at the top: `All` / `Dresses` / `Shirts` / `Skirts`.
- A **+** button opens the file picker (`<input type="file" accept="image/*">` — on iOS this offers Photo Library / Camera).
- After picking an image, show a small sheet: preview + three category buttons (Dress / Shirt / Skirt) + optional name field + Save.
- Tap an existing item → sheet with the image, its category (editable), name, and a Delete button.
- Deleting an item should also delete any outfits that reference it.

**Thumbnail generation:** on import, draw the image to an offscreen `<canvas>` scaled so the long edge is 200px, then `canvas.toBlob()`. Keep the original blob too. Preserve alpha — use `image/png`, not JPEG.

### 2. Build (the main screen)

This is the core interaction. Two modes, toggled by a segmented control at the top: **Separates** and **Dresses**.

**Separates mode**
- The screen is split into two horizontal bands: top band shows one shirt, bottom band shows one skirt, stacked vertically so they read as an outfit.
- Each band is independently **swipeable horizontally** to flip to the next/previous item in that category. Think two independent carousels stacked vertically — like a slot machine or one of those flip-book children's books.
- Swipe left/right on the top band → next/prev shirt. Same for the bottom band with skirts.
- Wrap around at the ends.
- Small position indicator per band (e.g. "3 / 12").

**Dresses mode**
- A single full-height band showing one dress, swipeable horizontally.

**Save button** (fixed, bottom-right, above the tab bar)
- Saves the current combination as an `Outfit`.
- Show a brief confirmation (toast or a checkmark animation).
- If the exact same combination is already saved, disable the button or show "Already saved."

**Empty states:** if there are no shirts (or no skirts / no dresses), the band shows a prompt to add items, and Save is disabled.

**Implementation note on swiping:** use pointer events (`pointerdown`/`pointermove`/`pointerup`) with a horizontal drag threshold, or a small library like `embla-carousel-react` if it saves time. Must feel responsive on touch — no lag, no 300ms delay. Set `touch-action: pan-y` on the bands so vertical page scroll still works.

**Rendering the stack:** each band contains the item image with `object-fit: contain`, transparent background. Don't try to align hems or scale garments to match — just show them stacked in their bands. Keep it simple.

### 3. Outfits

- Grid of saved outfits, 2 columns.
- Each card shows a composite preview: shirt image above skirt image (or the dress).
- Tap → full view with a Delete button.
- Optionally allow renaming.

Generate the composite preview **at render time** from the item thumbnails (just two stacked `<img>` in a container). No need to rasterize and store a preview image.

---

## Build order

Build and verify each phase before moving on.

**Phase 1 — Skeleton**
- Vite + React + TS project, PWA plugin configured with a manifest (name, icons, `display: standalone`, portrait orientation).
- Bottom tab bar, three empty routes.
- Verify it installs to the iOS home screen and opens fullscreen.

**Phase 2 — Items**
- Dexie setup, `items` table.
- Import flow: file picker → preview → category select → thumbnail generation → save to IndexedDB.
- Closet grid rendering from IndexedDB, with category filter.
- Item detail sheet with delete.
- Verify items persist across a full app restart.

**Phase 3 — Build screen**
- Separates mode: two stacked swipeable bands.
- Dresses mode: single band.
- Mode toggle.
- Empty states.
- Verify swipe feels good on an actual phone, not just in a desktop browser with a mouse.

**Phase 4 — Outfits**
- `outfits` table.
- Save button on Build screen with duplicate detection.
- Outfits grid with composite previews.
- Outfit detail + delete.
- Cascade delete: removing an item removes outfits that reference it.

**Phase 5 — Polish**
- Loading states, object URL cleanup, smooth transitions.
- Handle the case of a very large closet (virtualize the grid if it gets slow, but don't do this preemptively).

---

## Constraints and gotchas

- **iOS Safari + IndexedDB:** storage can be evicted under pressure. Call `navigator.storage.persist()` on first load to request persistent storage.
- **Object URLs leak.** Every `createObjectURL` needs a matching `revokeObjectURL`. Use a `useEffect` cleanup or a small custom hook (`useBlobUrl(blob)`).
- **Alpha channel:** always PNG for thumbnails. A JPEG thumbnail will turn transparent regions black.
- **Don't store images as base64 strings** — 33% size overhead and slow. Blobs go straight into IndexedDB.
- **No `<form>` elements** — use plain buttons and onClick handlers.
- Mobile-first. Test at 390×844. Respect safe-area insets (`env(safe-area-inset-bottom)`) so the tab bar isn't under the home indicator.

---

## Definition of done

I can, on my phone:
1. Import a transparent PNG of a shirt from my photo library and tag it as a shirt.
2. Do the same for several skirts and a couple of dresses.
3. Open the Build tab, swipe the top band to flip through shirts and the bottom band to flip through skirts, and see them stacked as an outfit.
4. Hit Save and have that outfit appear in the Outfits tab.
5. Close the app entirely, reopen it, and everything is still there.
