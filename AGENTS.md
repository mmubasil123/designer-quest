# momu-collection-db

Entry file for every agent on this repo (Claude Code, Cursor, Codex, app threads) and for both people working on
it. `CLAUDE.md` loads this file and adds only Claude-specific notes.

## Start here
1. `git pull`, then read `HANDOVER.md` (where work stopped) and `LEDGER.md` (tickets, decisions D1 to D8, owners).
2. `ARCHITECTURE.md`: components, data flow, invariants. `README.md`: layout and commands.
3. Serve the mockup: `cd mockups && python3 -m http.server 8765 --bind 127.0.0.1`, open `/second-skin.html`.
   `window.secondSkin = { look, turntables }` drives it from the console for checks.

## First-time setup (each person, own machine)
```
git clone git@github.com:mmubasil123/momu-collection-db.git && cd momu-collection-db
python3 -m venv .venv && .venv/bin/python -I -m pip install -r requirements.txt   # only for the 3D pipeline
cp .env.example .env && chmod 600 .env    # then: zsh tools/set_hf_token.sh (your own HF token)
createdb momu && pg_restore -d momu --no-owner seed/momu_full.dump                # only for DB queries
```
The mockup alone needs none of this: it is static files plus three.js from a CDN.
Splat work only: the raw MoMu `.ply` captures (about 220 MB each) live in the git-ignored `splats/`; get them
from MoMu's hackathon page (Splatting_FOLDER on Google Drive) or from Mubasil. The converter is PlayCanvas
`splat-transform` in the git-ignored `tools/node/`:
`mkdir -p tools/node && cd tools/node && npm init -y && npm install @playcanvas/splat-transform@3.10.3`.
`tools/craft/` (VectorCraft, TextureCraft CLIs for `.mcp.json`) is not in git; without it those two MCP servers
just fail to connect.

## Scope
- MoMu Hackathon 2026: the harvested collection DB and the Second Skin mockup.
- Private repo: github.com/mmubasil123/momu-collection-db. Discards move to `_to_delete/` (git-ignored), never `rm`.

## Working together (two people, several agents)
- **Claim before you start.** Put your name in the ticket's Owner/Status in `LEDGER.md`, commit and push that
  alone, then start. Someone else's name there means hands off; ask the person, not their agent.
- **One branch per ticket**, named `<name>/<ticket>` (e.g. `basil/A2`). Open a PR to `main`; no review is
  needed, but a PR is merged only when its developer says so, never automatically (an agent asks first). Nobody pushes straight to `main` except a claim or a `HANDOVER.md` update.
- **`mockups/second-skin.html` is one file:** only one open branch may change it at a time. Check
  `gh pr list` and the ledger before touching it; keep those PRs small and merge them quickly.
- **Pull and rebase before you push** (`git pull --rebase origin main`). On a conflict in someone else's code,
  stop and ask; never resolve it by dropping their side.
- **Shared contracts:** follow the Change policy at the end of `LEDGER.md` (what is safe without asking, what needs
  a heads-up to the other person first: `pieces.json` schema, save schema, URL params, GLB names, D1 to D8).
- **End of session:** update `HANDOVER.md` (state, what is half done, next step) so the other person's agent can
  continue without asking.

## Rules
- **Research log.** Before any research (web, agents, audits), search `docs/RESEARCH-LOG.md` and reuse what is
  there; research only the gap. When an analysis is done, append one row (date, topic, conclusion, where).
- Every change gets a `CHANGELOG.md` entry: what, why, and the decision.
- Verify UI changes in Chrome before calling them done (front, side and back of the turntable, console clean).
- Python runs from the project `.venv` with `-I`; install only into `.venv` and add the pin to `requirements.txt`.
  No global installs or shell-profile edits (one laptop is shared with an employer).
- Secrets live only in `.env` (git-ignored, chmod 600). Never print, commit or paste `HF_TOKEN`.
- GPU quota is scarce (about 2 TRELLIS runs a day per HF account): regenerate GLBs only on purpose, say in the PR
  which ones, and never dodge the quota with extra accounts. GLBs are committed so nobody regenerates them twice.
- Facts about MoMu pieces (dates, techniques, history) come from the collection data (DB or `cache/`), never from
  model memory. A missing field shows "not recorded" (D3).
- Change a decision in `LEDGER.md` only by editing its row and saying why.
- Study pieces (splats): commit only the `.sog` (under 50 MB), never a `.ply`. Each detail's `quote` is cut
  verbatim from the record's `dcterms:description` (check it with a script); place `details[].at` with
  `upClose.fracAt(x, y, fz)` in the console on `up-close.html`, checking front and back. Steps are in `HANDOVER.md`.
- Deploys: the Vercel project `second-skin` is on Mubasil's account. Only Mubasil deploys, and only on purpose.

## Delivery
- Hackathon presentation: story, persona and demo script in `presentation/STORYLINE.md` (slides still ticket E1,
  recording E2 in `LEDGER.md`); the cut and its risks are at the end of `LEDGER.md`. Problem statement, ideation
  and team roles: `docs/PROJECT_NOTES.md`.
- CLO path: CLO on a personal machine, pattern files from MoMu, the `Lilbonner/clo3d-mcp` listener. Engine
  changes needed are in `HANDOVER.md` and ticket A7.
