---
name: MoMu
description: Real MoMu Study Collection pieces on one museum dress form, set in the museum's own template.
colors:
  accent: "#d72f25"
  accent-ink: "#c00000"
  accent-on-black: "#ff5a4f"
  ink: "#000000"
  paper: "#ffffff"
  wall: "#ededed"
  page: "#e2e2e2"
  muted: "#595959"
  line: "#cbcbcb"
  muted-on-black: "#c9c9c9"
typography:
  display-numeral:
    fontFamily: "Hanken Grotesk, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "calc((100vw - 2 * var(--gutter)) / 2.08)"
    fontWeight: 400
    lineHeight: 0.74
    letterSpacing: "-0.04em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Hanken Grotesk, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "clamp(34px, 4.4vw, 60px)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "0.01em"
  display:
    fontFamily: "Hanken Grotesk, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "27px"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "0.01em"
  title:
    fontFamily: "Hanken Grotesk, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "0.01em"
  title-small:
    fontFamily: "Hanken Grotesk, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.01em"
  body:
    fontFamily: "Hanken Grotesk, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  small:
    fontFamily: "Hanken Grotesk, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Hanken Grotesk, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.06em"
    fontFeature: "tnum"
  quote:
    fontFamily: "Source Serif 4, Georgia, Times New Roman, serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.4
  lede:
    fontFamily: "Source Serif 4, Georgia, Times New Roman, serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  pic: "2px"
  card: "6px"
  sheet: "20px"
  pill: "999px"
spacing:
  gutter: "clamp(16px, 3.4vw, 48px)"
  target: "44px"
  track: "104px"
  track-phone: "92px"
components:
  button-go:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  button-go-hover:
    backgroundColor: "{colors.accent-ink}"
    textColor: "{colors.paper}"
  pill-floating:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  year-thumb:
    backgroundColor: "{colors.accent}"
    rounded: "{rounded.pill}"
    size: "26px"
  dialog-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "24px 22px 20px"
  sheet:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.sheet}"
  picture:
    backgroundColor: "{colors.wall}"
    rounded: "{rounded.pic}"
---

# Design System: MoMu

## Overview

**Creative North Star: "The Template on the Gallery Floor"**

The system is MoMu's own hackathon presentation template carried onto a phone: a white ground, black ink, and every title set in red capitals in a plain grotesque at regular weight. Where a slide template has no opinion, momu.be fills in: floating white pills on a soft offset shadow, sharp-cornered pictures, hairline rules, red underlines on links, and a serif reserved for the museum's own words. Pieces stand on a gallery-grey floor that fades up from white, so cutouts read as objects on a plinth rather than images in boxes.

Density is calm and editorial. Type carries the hierarchy through colour and case, never through weight: titles are 400, labels are 500, nothing is bold. Numbers are tabular everywhere a year, id or count appears, because dates are the game. The landing page adds one signature: the year itself, set as a giant red tabular numeral that runs gutter to gutter behind the dress form and is driven by a single year track.

Motion is quick and physical. Exits are shorter than entrances; outfits drop onto the form with a strong ease-out, and reduced motion collapses every transform and blur to a plain fade.

**Key Characteristics:**
- White ground, black ink, red capitals for titles; one red, in two depths.
- Hanken Grotesk for everything; Source Serif 4 italic only for record quotes and editorial reading text.
- Gallery-grey floor gradient under every piece; sharp 2px picture corners.
- Floating white pills with a soft offset shadow; 1px hairline rules for structure.
- Tabular numerals for every year, id and count.
- The year numeral and year track as the landing signature.

## Colors

One red on white and black, with a gallery grey as the only surface tone.

### Primary
- **Template Red** (accent): titles on white, the year numeral, link underlines, the year-track thumb, found-count dots and the film play disc. Passes 4.9:1 on white.
- **Deep Template Red** (accent-ink): any title that sits on the grey floor (Stage look title, landing caption name, pitch headline, closing headline), hover state of the black button, and the selection highlight. Holds AA where Template Red drops to 4.1:1 on grey.
- **Red Lifted for Black** (accent-on-black): the single exception for red titles on a black band (the film section), at 5.6:1.

### Neutral
- **Ink** (ink): all body text, the primary button, the year-track rail, tick marks, focus rings, the film and footer bands.
- **Paper** (paper): ground, cards, pills, sheets, dialogs.
- **Gallery Wall** (wall): the floor behind photos and the dress form, always reached by a gradient from Paper; photos multiply onto it.
- **Pitch Page** (page): the desktop pitch layout backdrop only.
- **Archive Grey** (muted): ids, credits, counts, secondary text and hints (7:1 on white, 6:1 on Gallery Wall).
- **Hairline** (line): 1px rules and control borders.
- **Muted on Black** (muted-on-black): secondary text on the film and footer bands.

### Named Rules
**The Two Reds Rule.** Template Red is for red on white; anything red that sits on the grey floor uses Deep Template Red. The choice is a contrast decision, not a mood one.

**The Floor Rule.** Gallery Wall never appears as a flat block; it is reached by a vertical gradient from Paper (white under the bar, grey at the floor, about 52 to 72 percent down).

## Typography

**Display Font:** Hanken Grotesk (with Helvetica Neue, Helvetica, Arial)
**Body Font:** Hanken Grotesk
**Editorial Font:** Source Serif 4, italic for quotes (with Georgia)

Both families are OFL and self-hosted from `assets/fonts/`; nothing is fetched from a third party.

**Character:** A plain, slightly warm grotesque standing in for the template's Arial, set at regular weight so the red and the capitals do the work; a bookish serif that only speaks when the museum does.

### Hierarchy
- **Display numeral** (400, viewport-fluid so "1750" spans gutter to gutter, line-height 0.74, -0.04em, tabular): the landing year; repeated as the closing "1750–2005" band.
- **Headline** (400, clamp 34 to 60px, 1.02, red capitals, max 14ch, balanced): landing section titles; the desktop pitch layout uses 40px.
- **Display** (400, 27px, 1.1): the Stage look title (set at 22px there).
- **Title** (400, 22px, 1.15, red capitals): sheet, dialog and record titles.
- **Title small** (400, 18px, 1.2): compact titles.
- **Body** (400, 15px, 1.45): running text; landing paragraphs step up to 16 to 18px with max 46ch.
- **Small** (400, 13px, 1.4): credits and secondary lines; the old mono role is Small at 12px in Archive Grey with tabular figures.
- **Label** (500, 11px, 0.06em, uppercase, tabular): inventory ids, era ticks, counts. Placed after a title, never above it.
- **Quote** (italic 400, 17px, 1.4, Source Serif 4): record quotes, with curly quote marks.
- **Lede** (400, 19px, 1.5, Source Serif 4): the one editorial introduction under a section title.

### Named Rules
**The Regular Weight Rule.** Titles are weight 400 in red capitals with +0.01em tracking. Emphasis comes from case and colour, never from bold.

**The Museum's Words Rule.** Source Serif 4 is reserved for what the record says and for editorial reading text. Interface text is always Hanken Grotesk.

**The Tabular Year Rule.** Every year, id, count and duration uses tabular figures.

## Layout

Phone first, readable at 320px. The landing page uses a fluid gutter (clamp 16 to 48px) and a 1240px content column. The hero is a full-viewport stage (100svh, min 700px) with absolutely placed parts: numeral behind, dress form centred and overlapping it, caption bottom left, pitch and Start bottom right, the year track full width along the bottom (104px tall). Below 900px the hero becomes a single column in the order numeral, form, track, pitch, caption; the numeral drops to min(36vw, 200px) and the form tucks half a numeral height up into it. Short desktop windows (under 820px tall) hide the caption quote so the year keeps its height.

Content sections alternate a 5:6 two-column split with generous vertical rhythm (section padding clamp 96 to 168px, beat gap clamp 72 to 136px); media and text swap sides on even rows and stack on phones. Hit targets are 44px minimum everywhere.

## Elevation & Depth

A hybrid: the page is flat and structured by hairlines and the white-to-grey floor gradient, while interactive objects float. Floating is reserved for pills, dialogs, sheets and the year thumb.

### Shadow Vocabulary
- **Pill float** (`box-shadow: 3px 5px 22px rgb(0 0 0 / .16)`): white pills, nav links over the numeral, zoom buttons, hotspots, span pins. momu.be's float scaled for a phone.
- **Card** (`box-shadow: 0 18px 50px rgb(0 0 0 / .24)`): dialogs and the landing guess card.
- **Sheet** (`box-shadow: 0 -10px 36px rgb(0 0 0 / .12)`): the bottom wardrobe sheet.
- **Thumb** (`box-shadow: 0 2px 10px rgb(0 0 0 / .28)`): the year-track thumb.
- **Device frame** (`box-shadow: 0 30px 70px -30px rgb(0 0 0 / .45)`): black phone frames showing app screens in the visit beats (theme.css uses / .4 on the pitch layout).
- **Scrim** (`rgb(0 0 0 / .42)`): dialog backdrops.

### Named Rules
**The Soft Float Rule.** Every shadow is soft and blurred. Pills float by offset and blur, never by a border.

## Shapes

Pictures are sharp (2px); controls are round. Pills and the primary button are fully rounded (999px), the year thumb and play buttons are circles, dialogs take a small 6px corner, and the wardrobe sheet a 20px top corner. Caption tags on tiles sit flush in the picture corner with no radius. Structure is drawn with 1px Hairline rules; the facts list opens on a 1px Ink rule.

**The Sharp Picture Rule.** Museum pictures and swatches keep 2px corners, like the museum's own site; rounding belongs to controls.

## Components

### Buttons
- **Shape:** fully rounded pill (999px), 48px tall (44px in the nav, 56px at the close).
- **Primary ("Start dressing"):** Ink fill, Paper text, 500 16px, trailing arrow SVG.
- **Hover / Active:** fill shifts to Deep Template Red and the arrow slides 3px (fine pointers only); press scales to 0.97 over 160ms.
- **Ghost text button:** no border or fill, 500 15px, 44px tall.
- **Round play:** 44px circle, Paper fill, 1px Ink border, press scale 0.94.

### Floating Pills
- **Style:** Paper fill, Pill float shadow, 500 14 to 15px, 44px tall, no border. Hover underlines in Template Red.

### Links
- **Style:** underline in Template Red, 1.5px thick, offset 4px; text stays Ink.

### Cards / Containers
- **Dialogs and the guess card:** Paper, 6px corners, Card shadow, 24px padding; title leads, id follows.
- **Wardrobe sheet:** Paper, 20px top corners, Sheet shadow, no top border.
- **Tiles:** 2px corners, no border, name tag flush in the bottom-left corner.

### Inputs / Fields
- **Focus:** 2px Ink outline, 2px offset, site-wide. Caret in Template Red.
- **Guess slider:** native range with Ink accent colour, 44px tall.

### Year Track (signature)
A full-width range control: 2px Ink rail, 26px Template Red thumb with a 3px Paper ring and Thumb shadow, scaling to 1.15 while held. Era ticks are 1px by 8px Ink marks with Label text below in Archive Grey; the current era turns Ink. On phones only major ticks keep their text. Dragging releases snap the track to the nearest era; programmatic glides use an ease-in-out cubic over 260 to 900ms.

### Year Numeral (signature)
The current year in Template Red, tabular, -0.04em, line-height 0.74, sized so four digits span gutter to gutter and sitting behind the dress form. It is non-interactive and unselectable.

### Dress Form Swap (motion)
The outgoing outfit leaves in 200ms (opacity, 10px blur, lift of 18px, scale 0.985, plain ease). The incoming outfit drops in on `cubic-bezier(0.23, 1, 0.32, 1)`: opacity 420ms, blur 480ms, transform 640ms. The caption re-enters with a 6px rise over 260ms on the same curve. Reduced motion: opacity-only fade over 240ms.

## Do's and Don'ts

### Do:
- **Do** set every title in red capitals at weight 400; switch to Deep Template Red on the grey floor.
- **Do** place pieces on the Paper-to-Wall gradient floor, never on a flat grey block.
- **Do** keep pictures and swatches at 2px corners and controls fully rounded.
- **Do** use tabular figures for every year, id, count and duration.
- **Do** quote records in Source Serif 4 italic with curly quotes, and credit them in Small Archive Grey.
- **Do** make exits quicker than entrances (150 to 200ms out, 420 to 640ms in) on `cubic-bezier(0.23, 1, 0.32, 1)`, and drop to an opacity fade under reduced motion.
- **Do** keep MoMu's logo black (white on the black footer) at its 1.786:1 proportion.

### Don't:
- **Don't** set titles in bold or in a second display face; the template's plain grotesque at regular weight is the identity.
- **Don't** use Source Serif 4 for interface labels or buttons.
- **Don't** recolour the MoMu logo red or squash it to a wide proportion.
- **Don't** put Template Red text on the grey floor; it falls below AA there.
- **Don't** float flat surfaces: shadows belong to floating objects only (pills, dialogs, sheets, the thumb, the film play pill and phone frames).
- **Don't** place a label line above a title as a kicker; inventory labels follow the title.
