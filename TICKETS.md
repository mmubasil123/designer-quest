# Second Skin: dress-form 3D engine

Goal: clothes on the avatar look smooth and consistent at every angle. One three.js scene, a dress-form avatar
(the form every MoMu photo is shot on), garment-only scans, automatic fit by slot.

Files: `mockups/second-skin.html` (one file, so HTML tickets run one at a time), `mockups/tools/*.py`.
Serve: `cd mockups && python3 -m http.server 8765 --bind 127.0.0.1`.

| # | Ticket | Owner | Depends on | Status |
|---|---|---|---|---|
| T1 | Garment-only cutouts (local segformer; shoes and kimono skip it) | Sonnet | none | done |
| T2 | three.js engine + dress form | Opus | none | done |
| T3 | Auto-fit by slot | Sonnet | T2 | done |
| T4 | Delete the 2D drawing code | Sonnet | T2 | done |
| T5 | Regenerate GLBs from cutouts | shell (no agent) | T1 | partial: ST503 done, 4 wait for GPU quota |
| T6 | Verify in Chrome | Opus | T3, T4, T5 | done for current GLBs |

## T1 Garment-only cutouts
`mockups/tools/garment_mask.py <photo> <slot> <out.png>`: RGBA PNG, alpha = garment only (no mannequin, stand,
background). Model `mattmdjaga/segformer_b2_clothes` via `huggingface_hub.InferenceClient.image_segmentation`,
token from project `.env`. Keep every clothing label except the ones the slot excludes (a coat or jak may be
labelled Dress): top drops Pants, Skirt, shoes; bottom keeps Pants, Skirt, Belt; feet keeps Left-shoe, Right-shoe;
full keeps all clothing. Body, Face, Hair, arms, legs and Background are always dropped. Pillow goes in the project `.venv` only.
`batch_glb.py` calls it before `img2glb`. TRELLIS keeps an existing alpha instead of its own background removal
(microsoft/TRELLIS `trellis/pipelines/trellis_image_to_3d.py:86`; the community Space is assumed to match).
Done when: ST503 cutout shows the jak with no neck form or stand.

## T2 three.js engine + dress form
Replace the per-slot canvases and per-slot `<model-viewer>` boxes in `Turntable` with one WebGL canvas: a
procedural dress form (lathe torso, neck, pole, base) plus the equipped GLBs in one group, one camera, one light
rig. Rotation is continuous (fractional frame), the dial still shows whole 10° steps. Skin swatches tint the form.
GLBs load once (cached) and are cloned per turntable. Keep the Turntable API (`setFrame`, `swap`, `draw`,
drag/coast/idle spin). three.js is a module: pin one version via an import map and turn the main script into
`type="module"`. Basic centring only; placement is T3. Done when: Stage and Locker both turn smoothly with the form and the equipped pieces.

## T3 Auto-fit by slot
Drop the hand-set `fit` arrays. On load, measure each GLB's bounding box and place it: top under the neck at the
shoulder line, bottom at the waist, feet on the floor, full from the shoulder line; scale by width to the form
(per-slot target widths); centre on the pole. The form has no legs or feet: bottoms hang from the waist around the pole, shoes stand on the
floor either side of the base. Tops render a little wider than bottoms so they cover the waistband.
Optional per-piece `adjust` multiplier only where a piece needs it.

## T4 Delete the 2D drawing code
Remove `BODY`, `sym`, `shapes`, `sample`, `swatches`, `drawBody`, `drawPiece`, `widthAt`, `path`, `shade` and the
`.turntable canvas` swap CSS once T2 renders everything. Update the intro sheet text (frames are no longer drawn in
the browser). No behaviour change beyond that.

## T5 Regenerate GLBs from cutouts
Move the current `mockups/assets/*.glb` to `_to_delete/` (do not delete), run `batch_glb.py`, check each GLB loads.
Hugging Face GPU quota may stop the batch; rerun resumes.

## T6 Verify in Chrome
Every look at front, side and back, on Stage and Locker; no console errors; record what still looks wrong.

## Status 2026-11-21
- T5: the free ZeroGPU quota ran out after ST503. ST80930, ST2434, ST80931 and ST655/1 show their old
  mannequin GLBs (copied back from `_to_delete/glb_with_mannequins/`). Once the quota resets, from the project root:
  `rm mockups/assets/{ST80930,ST2434,ST80931,ST655_1}.glb && .venv/bin/python -I mockups/tools/batch_glb.py`
  (the originals stay in `_to_delete/`).
- T6 found the form showing through garments; fixed with a two-pass render (form, clear depth, garments).
- Fixed: a worn top or full look hides the form's torso (neck stays), so no scan shows the form beside its collar.
- Kimono: stand hidden in the shader (`hideStand`, a shortcut). Real fix once quota resets: TRELLIS from the photo
  with the VectorCraft cutout (`mockups/assets/ST80881_cutout.png`) as alpha, then drop `hideStand`.
- Known: TRELLIS guesses backs from one photo (the jak's back is dark).

## Added 2026-11-21 (night)
| # | Ticket | Status |
|---|---|---|
| T7 | Fabric remix (triplanar, object space) + swatches | done |
| T8 | Two-zone remix (body / sleeves) | done |
| T9 | Motion: slower eased spin, settle-in, tone mapping, rim light, contact shadow | done |
| T10 | Look names + one-time Firsts toasts | done |
| T11 | Regenerate 4 mannequin scans + kimono without stand | 4 scans done; kimono still has the stand shortcut |
| T12 | Card scan start, share card, locked-piece silhouettes | open |
