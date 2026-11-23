# MoMu reel (E2)

The MoMu teaser video, made in code with Remotion. Script, storyboard and checks: `presentation/DEMO_VIDEO.md`.
Look and rules: `style.md`.

## Make the teaser (from this folder)
```
npm i                                  # Remotion 4.0.545, playwright-core; node_modules is git-ignored
npx remotion skills add                # Remotion's agent skills into .agents/ (git-ignored)
sh scripts/prepare.sh                  # MoMu photos, fonts, logo -> public/momu/
python3 -I scripts/sfx.py              # sound effects -> public/sfx/
(cd ../../mockups && python3 -m http.server 8791 --bind 127.0.0.1) &
node scripts/capture.mjs               # the app's real screens at 390 px -> public/shots/
npx remotion render src/index.ts MomuTeaser reels/momu-teaser/momu-teaser.mp4 --codec=h264
python3 -I scripts/check.py reels/momu-teaser/momu-teaser.mp4 "<scene cut seconds>"
```
`npm run dev` opens Remotion Studio to preview and scrub. `node scripts/stills.mjs` renders the storyboard sheet.

Remotion is free for individuals and companies of up to 3 people; a bigger company (MoMu itself) needs a
company licence (remotion.dev/license).
