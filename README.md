# Our Little Universe ♥

A handmade-feeling digital scrapbook for two people. Built with plain HTML, CSS and JavaScript — no backend, no build step, no frameworks.

## What's inside

- A romantic hardcover **cover page** with an opening animation and an editable anniversary date.
- **9 unique scrapbook pages** with realistic 3D page-turning, shadows, stacking, page numbers, arrow / keyboard / swipe / edge-tap navigation. The "One Story, Together" page also has its own swipeable photo carousel.
- **31 editable photo frames** across the two-page spreads. Images placed in `assets/images/` (named after the slot ID, e.g. `p1.main.jpg`) are loaded automatically as the starting photos; photos you upload later override them. Every image is cropped to fit its frame, and you can drag / zoom it with **Adjust**. Replace or delete photos at any time.
- **Editable captions, titles, dates, locations, messages and the love letter** — just turn on *Edit mode* and click the text.
- **Automatic saving** in the browser's LocalStorage, with compressed photos, a storage-full warning and a confirmed reset option.
- Subtle pink floral background animations (petals, hearts, flowers) that respect `prefers-reduced-motion`.
- Optional background music that starts automatically at **45% volume** after you unlock the album (or on your first click if already unlocked), with play/pause and mute controls tucked into a hidden `✿` menu together with Edit mode and Reset. Pausing or muting is remembered.
- A **password screen** on open (`ilovejelay`), with a friendly retry loop for wrong attempts. It remembers a correct entry on the same device.
- Fully responsive: desktop, laptop, tablet, Android and iPhone.

## Run it locally

Just double-click `index.html`, or serve the folder with any static server:

```bash
# Python 3
python -m http.server 8000
```

Then visit <http://localhost:8000>.

## Deploy to GitHub Pages

1. Create a GitHub repository and upload the **contents of this folder** (`index.html`, `style.css`, `script.js`, `README.md` and the `assets/` folder).
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source = Deploy from a branch**, choose `main` (or `master`) and the `/ (root)` folder, then **Save**.
4. After a minute or two your album is live at `https://<your-username>.github.io/<repository-name>/`.

Everything works from relative paths, so it also works if the repository lives in a subfolder.

## Adding your own music

Drop an MP3 named `background.mp3` into:

```
assets/music/background.mp3
```

The music starts by itself at 45% volume as soon as the browser allows it (after the password is entered, or after your first click when already unlocked). Browsers block sound autoplay before any interaction, so this is the earliest possible moment. Use the `♪` button in the hidden `✿` menu to play/pause and `♫` to mute; your choice is remembered. If the file is missing, the button shows a friendly hint instead of failing.

## Password

On first open the album asks for a password. The current password is `ilovejelay`.

- A wrong password clears the box and asks you to try again.
- A correct password unlocks the album and remembers it in this browser, so it won't ask again here.
- To see the password screen again, clear this site's data in your browser (or change `PASSWORD` in `script.js`).

This is a sweet little gate, not real security — the password is inside the client-side code.

## Customising the album

1. Open the album, enter the password, and click **Edit mode** in the top bar.
2. Click any text to type your own (titles, dates, captions, the letter, signature...).
3. Click a photo frame to choose an image from your device. It is automatically fitted to the frame. In Edit mode, use **Adjust** to drag the photo or zoom in/out before saving, **Replace** to pick another, or **×** to remove it.
4. Turn **Edit mode** off to enjoy the clean finished gift.

All changes are saved automatically in the browser you are using.

## Important notes about saving

- The album is **browser-local**. Text edits live in LocalStorage, while photos are stored in **IndexedDB**, a much larger browser database — they do **not** sync across devices and are **not** uploaded to GitHub.
- Uploaded images are automatically cropped to their frame and saved as compact JPEGs at a size matched to the frame (about 360–900 px), so the whole album stays well under typical browser limits. Existing large saves are shrunk once automatically on the next load.
- IndexedDB can hold far more than LocalStorage (often hundreds of MB, depending on the browser). Photos saved by older versions are migrated into it automatically on the next load. If a browser ever refuses a save, a warning appears and the newest change stays on screen but is not stored; use **Reset** only if you deliberately want to clear everything.
- **Reset** deletes everything stored for this album in the current browser after a confirmation.
- Clearing browser site data also clears the album. Consider keeping copies of your favourite photos elsewhere.

## File structure

```
our-little-universe/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
    ├── images/          (optional – uploads are stored in the browser)
    └── music/
        └── background.mp3   (optional – add your own song)
```

Made with love, petals and a lot of ♥.
