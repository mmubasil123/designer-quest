@AGENTS.md

## Claude Code notes
- `AGENTS.md` above holds every shared rule; keep this file to Claude-only notes.
- `.mcp.json` registers VectorCraft and TextureCraft from `tools/craft/` (not in git); copy that folder from
  Mubasil if you need them.
- Use the Claude in Chrome tools for the UI check in the rules: front, side and back, then read the console.

## Hackathon build: no legal or compliance notes
- For the hackathon the team has set GDPR, data-residency and EU AI Act questions aside (Hassan, 2026-11-21).
  Don't add compliance notes, AI labels or disclaimers to UI copy, PRs, `CHANGELOG.md` or code comments, and don't
  hold work back over them. Revisit before real visitors use the app.

## Design work: skills and best practice
- For any design decision (new or changed UI, layout, type, colour, motion, copy on screen), run the `/impeccable` and
  `/emil-design-eng` skills first and design with them, following current design best practice: AA contrast, a clear
  type hierarchy, 44 px targets, purposeful motion that respects reduced-motion, the MoMu tokens in `mockups/theme.css`.
  Then verify in Chrome at 390 px (decided by Hassan, 2026-11-21).
- The Impeccable detector runs after UI edits. Fix what it finds; a finding in a captured third-party file (`recon/`)
  may get a narrow ignore in `.impeccable/config.json` with the reason written down. Never ignore a whole rule to get
  past a finding in our own UI.
