# MoMu collection DB and Second Skin

Two things live here, for the MoMu Hackathon 2026 (MoMu is the Antwerp fashion museum):

1. **The collection database.** MoMu's public collection data, harvested from the Omeka S APIs behind
   studycenter.momu.be and heron.libis.be/momu into a normalised Postgres schema.
2. **Second Skin**, a web mockup where visitors unlock real collection pieces and dress a 3D museum dress form in
   them, remix fabrics across pieces and centuries, and learn the history as they go.

## Layout

| Path | What |
|---|---|
| `harvester/momu_harvest.py` | Two-stage harvester: `fetch` (API to `cache/`, polite, robots-aware) and `load` (cache to Postgres) |
| `schema.sql` | Postgres schema (objects, values, concepts, agents, media, showcases) |
| `seed/momu_seed.sql.gz`, `seed/momu_full.dump` | Loaded data: 4622 objects, 9323 media |
| `mockups/second-skin.html` | The 4-screen mockup (Stage, Locker, Piece, Knowledge track); one file, three.js from a CDN |
| `mockups/up-close.html` | Look closer: study a MoMu Gaussian splat, find its recorded details, win its fabric |
| `mockups/pieces.json` | Piece manifest: slot, year, source photo, GLB kind (`scan` or `clo`), fit and pipeline hints |
| `mockups/assets/*.glb` | One 3D model per piece, generated once and stored (the page never calls an API) |
| `mockups/assets/swatch/*.jpg` | Tileable fabric swatches for the Remix tab |
| `mockups/assets/src/` | Source photos and garment-only cutouts |
| `mockups/tools/` | The 3D pipeline (below) |
| `tools/craft/` | VectorCraft and TextureCraft CLIs, registered as MCP servers in `.mcp.json` |
| `AGENTS.md`, `ARCHITECTURE.md` | Rules for every agent and both people; components, data flow, invariants |
| `LEDGER.md`, `TICKETS.md`, `CHANGELOG.md`, `HANDOVER.md` | Ticket ledger and decisions, earlier tickets, changes with reasons, next-session notes |

## Run the mockup

```
cd mockups && python3 -m http.server 8765 --bind 127.0.0.1
```
Open http://127.0.0.1:8765/second-skin.html. Drag the avatar to turn it. Pull up the wardrobe sheet: pick Top,
Bottom, Feet or Full look; the Remix tab puts any unlocked piece's fabric on the body or sleeves of your top.
`?card=<inventory id>` simulates scanning a museum card.

## The 3D pipeline

Photo -> garment-only cutout -> TRELLIS image-to-3D -> GLB -> auto-fit on the dress form.

```
.venv/bin/python -I mockups/tools/batch_glb.py      # makes assets/<id>.glb for every unlocked piece that lacks one
.venv/bin/python -I mockups/tools/make_swatches.py  # rebuilds the Remix swatches
```
- `garment_mask.py`: local segformer (`mattmdjaga/segformer_b2_clothes`) keeps only the garment. Shoes and the
  kimono skip it (the model is trained on people and drops them).
- `img2glb.py`: the public TRELLIS Space on Hugging Face. Needs `HF_TOKEN` in the project `.env`
  (`zsh tools/set_hf_token.sh` writes it without echoing). Each run spends about 120 s of the account's free
  ZeroGPU allowance (a few minutes a day, refilling about 24 h after first use).
- The piece list is `mockups/pieces.json` (schema `mockups/pieces.schema.json`), read by both the page and the pipeline.

Python lives in the project `.venv` only (torch and transformers make it about 1 GB). No global installs.

## Engine in one paragraph

One three.js scene per turntable: a procedural dress form, plus each worn GLB scaled and placed by slot from its
bounding box. The form renders first and garments over a cleared depth buffer, so a scan never shows the form
through it; a worn top hides the torso and keeps the neck. A shared garment shader adds smooth normals, hides the
stand baked into some scans, and projects remix fabrics in object space (triplanar) multiplied by the scan's own
shading, with a body and a sleeves zone. CLO-draped GLBs can replace scans file by file (see `HANDOVER.md`).
