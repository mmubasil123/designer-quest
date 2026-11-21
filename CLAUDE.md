# momu-collection-db

## Start here
1. Read `HANDOVER.md` (where the last session stopped), then `LEDGER.md` (tickets, decisions, hackathon cut).
2. `README.md` has the layout, how to run the mockup and the 3D pipeline.
3. Serve the mockup: `cd mockups && python3 -m http.server 8765 --bind 127.0.0.1`, open `/second-skin.html`.
   `window.secondSkin = { look, turntables }` drives it from the console for checks.

## Scope
- MoMu Hackathon 2026: the harvested collection DB and the Second Skin mockup.
- Not a git repo yet. Discards go to `_to_delete/`, never `rm`.

## Rules
- Every change gets a `CHANGELOG.md` entry: what, why, and the decision (the user asked for this).
- Verify UI changes in Chrome before calling them done (front, side and back of the turntable, console clean).
- Python runs from the project `.venv` with `-I`; install only into `.venv`. This laptop is shared with an
  employer: no global installs or shell-profile edits.
- `HF_TOKEN` lives in `.env` (chmod 600). Never print it. GPU quota is scarce: regenerate GLBs only on purpose,
  and never to dodge the quota with extra accounts.
- `second-skin.html` is one file: only one agent edits it at a time.
- Facts about MoMu pieces (dates, techniques, history) come from the collection data, not from memory.

## Delivery
- Hackathon presentation: Stage turntable, Locker remix, time-span game. Demo flow is in `HANDOVER.md`.
- CLO path: CLO on a personal machine (WeTransfer is blocked on this laptop), pattern files from MoMu, the
  `Lilbonner/clo3d-mcp` listener. Engine changes needed are listed in `HANDOVER.md`.
