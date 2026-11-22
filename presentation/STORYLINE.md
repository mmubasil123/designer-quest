# Storyline

The story we tell the jury, the persona behind it, and the demo script.
The problem, the ideation and the team are in `docs/PROJECT_NOTES.md`.

**Fact rule (D3):** every date, technique or history line said on stage comes from the MoMu record, not from
memory. Lines marked `[fact: ...]` are placeholders: the curator fills them from the record and keeps the record id next
to them. If a field is missing, we say "not recorded".

## One line

> Tap a real MoMu piece, hear its story, wear it on a museum dress form, and walk out with a collection that
> spans 250 years.

## The persona

**Noor, 19**, first-year student in Antwerp. Thrifts, follows fashion TikTok, has never heard of the Study
Collection. Her friend drags her to the Study Center.

| Without us | With us |
|---|---|
| Archive boxes, inventory numbers, Dutch-only labels | A card she can tap; the piece opens on her phone |
| "Fashion history" sounds like an exam | She wins the piece by noticing something about it |
| Leaves with nothing | Leaves with a wardrobe, a look and a share card |
| No reason to return | Locked pieces tell her which room their card is in |

Second persona to keep in mind: **Sam, 23**, fashion student who wants to flex knowledge. Sam goes for the rare
study pieces and the "find the 3 recorded details" challenge.

## Story arc (the pitch, 3 to 5 minutes)

| Beat | Time | What we say | What the screen shows |
|---|---|---|---|
| 1. Hook | 0:00 | "This jak is from 1750 to 1780. These boots are from 2005 to 2009. Noor is wearing both." | Share card: a 250-year look |
| 2. Problem | 0:20 | MoMu's Study Collection is thousands of pieces most young people never see; history feels like homework | One archive photo, the problem statement |
| 3. Insight | 0:45 | Young people don't want to read about clothes, they want to wear, collect and show them | Lotus Blossom outcomes in one line |
| 4. Demo | 1:00 | Live: Noor's visit (script below) | The phone |
| 5. How it works | 3:00 | Real MoMu records, garment scans, a dress form, no install, no account | One diagram |
| 6. Growth | 3:30 | 8 pieces today; the DB has 2075 objects with images; next season "Fibres and Hands, 1750 to 2009" | Season grid |
| 7. Ask | 4:00 | Tags at the Study Center, curator sign-off, pattern files for faithful 3D | Closing card |

## Demo script (Noor's visit)

Every beat uses something that already works unless marked **(to build)**. Presenter's phone on a hotspot;
the backup video (E2) follows the same order.

1. **Play.** Noor opens the app: a dress form and a starter wardrobe. Two taps make a look (green wool coat,
   monpe trousers, football boots). Say: "No app store, no account."
2. **Tap.** She taps the sticker beside the jak, ST503 (`?card=ST503`). Its photo and story open; narration plays.
3. **Win it.** "When was it made?" She drags the slider, gets "Earlier!", tries again: "You won it! 1750 to 1780",
   with the record's own description. Add it to my wardrobe.
4. **Wear it.** The wardrobe opens on the jak, marked New. She puts it on with the football boots: the look spans
   about 250 years. Say: "She won it by guessing, and now she remembers the date."
5. **Look closer.** She taps the sticker on the Vandevorst coat, ST81190: story, then Up close, a 3D scan. She
   finds its 3 recorded details; each quotes the record. You won its fabric.
6. **Remix.** She puts that fabric on the jak's sleeves. Say: "One piece's fabric on another, centuries apart."
7. **Share.** The 9:16 share card: look name, span in years, MoMu credit. Say: "Every share credits MoMu."
8. **Come back.** The Museum button: "2 of 11 won". The rest are waiting in the room.

Fallbacks: if a GLB is slow, skip to the next beat; if the venue wifi drops, play the backup video from the
same step.

## Demo pieces (from `mockups/pieces.json`)

| Id | Name | Slot | Years | Role in the story |
|---|---|---|---|---|
| ST503 | Jak | top | 1750 to 1780 | The opener: oldest piece |
| ST2434 | Green wool coat | top | 1795 to 1840 | Alternative opener |
| ST80930 | Ikat vest | top | 1950 to 1960 | Remix fabric |
| ST80931 | Monpe trousers | bottom | 1965 | Mix centuries |
| ST2062 | Knee breeches | bottom | 1850 to 1870 | Period-correct look |
| ST2407/1-2 | Football boots, Dirk Bikkembergs | feet | 2005 to 2009 | The punchline: newest piece |
| ST80881 | Furisode kimono | full | 1979 | Full-look moment |
| ST655/1 | Cocktail dress | full | 1947 to 1950 | Full-look moment |
| ST2435 | Sequin silk dress | study | 1920 to 1925 | Look closer |

Check every name and date against the record before the pitch; the manifest is not the source of truth for facts.

## Jury questions to prepare

| Question | Short answer |
|---|---|
| How would MoMu run this? | Static web app, cards or NFC tags at the Study Center, pieces added from the collection DB |
| Image rights? | Only MoMu's hackathon asset set for the demo; every share card credits MoMu; rights checked per piece before launch |
| Personal data? | No account and nothing stored on a server; progress lives on the phone. Any selfie try-on would be opt-in and processed on the phone |
| How does it scale? | The harvested DB has 2075 objects with images; the 3D pipeline turns a photo into a scan; pattern files from MoMu would allow exact 3D garments |
| Accessibility? | Zoom, full screen, help pop-up, reduced motion, English text for Dutch-only records marked as translation |
| Is the 3D accurate? | Scans guess the back from one photo; we say so, and the pattern-based CLO path is the fix |

## Still open

- Product name (appears in beat 1 and the closing card).
- Selfie and sign-up vs D1 and D2: see `docs/PROJECT_NOTES.md`. The script above uses no selfie.
