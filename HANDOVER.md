# Handover: where work stopped (2026-11-22)

Read this, then `LEDGER.md` (tickets, decisions D1 to D8). `CHANGELOG.md` has every change with its reason; how-tos
(splat study pieces, CLO models, deploy, narration, languages) are in `ARCHITECTURE.md` and `README.md`. Keep this page
short: replace its contents at the end of a session, do not append history (that is the CHANGELOG's job).
Never deploy, push to `main` or publish without your person's explicit go.

## State
- `main` has the whole phone flow: landing page `/` (E4), Stage `/stage` (`atelier.html`) without a dress form (H20), scan
  -> story -> one challenge -> won -> wardrobe, Up close, NL / EN / FR, narration, share card, QA rounds 1 and 2. App name:
  Designer Quest. Production (Vercel, Mubasil's account) should track `main`; Mubasil deploys, so check `/`, `/stage` and
  `/?card=ST503` on the live URL after his next deploy (E4 and later were not deployed by Hassan).
- Nothing has been checked on a real phone yet: 44 px tap reach and hint ring in Up close, share sheet, load over 4G.

## Open PRs (besides this trim, H24)
- #72 `basil/H-URL2` (H-URL): old `/second-skin.html` links redirect to `/stage`. Mubasil's.

## Half done or waiting
- **Mubasil's lane:** B9 (span as a large number, short tile names), A5 WebP GLBs, J1 to J4 texture and speed fixes, A9 avatar,
  Vercel rename (project, URLs, DB schema name `second_skin`). The ledger rows A6 and A9 may be stale: their branches are
  already in `main`.
- **D-3 languages:** NL / FR text is machine-made; a native read of `ui.*.json`, `content.*.json` and `glossary.json` is
  open (the curator). FR narration says "vous", FR UI "tu". Narration audio stays English; the landing page is English only.
- **C2:** only 3 pieces have text from the curator (jacket, blouse, trousers); the other 16 use record drafts, marked on screen.
- **Room numbers:** `pieces.json` has no `museumRoom` yet; locked tiles say "Find its card in the museum". Adding it is a
  schema change (heads-up to Mubasil first); the label then reads "Find card in room N".
- **E2:** the 44 s teaser is made but not played on the venue projector; re-capture and render after any screen change
  (`presentation/reel/README.md`). No full-demo backup recording.
- **Splat Stage (G2 to G4):** spike done; next is a phone check of `splat-stage-spike.html`, then cut rules into `pieces.json`
  hints (G3). Not started in the Stage.
- **Known art issues:** kimono ST80881 still hides its stand with `fit.hideStand` (rescan without the stand, J7-style GPU
  run); jak ST503 has a cream mannequin patch (J7); the 3 photo-only pieces have no 3D (A10 cut; ST2062 stays hidden);
  `make_swatches.py` keeps its own `POINT` / `SHIFT` dicts (A2).
- **GPU:** free ZeroGPU is about 2 TRELLIS runs a day per account; regenerate GLBs only on purpose.

## Next step
Phone test (Mubasil's phone or Hassan's) of `/?card=ST503`, a win, Up close on ST81190 and the share card; fix what breaks.
Then ask the curator for her remaining stories (C2) and her read of the NL / FR text.
