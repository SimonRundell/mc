# Mornington Crescent

*By Simon Rundell.*

A browser implementation of the parlour game of supposedly great skill. Three
computer players will join you. Nobody, including this README, will fully
explain the rules, because that has never once been the point.

## What it actually is

Four players — you and three computer opponents — take turns naming London
Underground stations (plus a scattering of non-stations that have wormed
their way into the lore: Birdcage Walk, Soho Square, Threadneedle Street, a
suspiciously Edinburgh-shaped Morningside Crescent, the traditional penalty
position of Knip, and every major London teaching hospital, including a
memorial entry for the long-demolished Middlesex). Whoever first calls
**Mornington Crescent** wins — unless another player objects, and the
objection is upheld, in which case play continues.

One house rule is drawn at random at the start of each game from a set of
129, and stays in force for the whole game. This is where it gets silly on
purpose.

## The rule engine's one joke

The 129 rules (`data/rules.json`) are largely pastiche — imported,
paraphrased, or invented in the style of *I'm Sorry I Haven't a Clue*'s
Mornington Crescent variations. 73 of them are flagged `enforceable`. The
honest position taken by the code (`src/engine/ruleEffects.js`) is:

- Rules whose conditions map onto something the station/line data can
  actually check (an allow-list, a line restriction, a scoring condition, a
  forced opening move, a time limit...) really do change what you can pick —
  the dropdown genuinely greys out.
- Rules that are enforceable *on paper* but whose condition needs data the
  app doesn't have (postcodes, "pedestrianised squares", proof you explained
  your route) are quietly left alone. The rulebook still claims they apply.
  The engine just can't check.
- Everything else is flavour: read it, enjoy it, ignore it.

Which category tonight's rule falls into is **not shown in the UI** on
purpose. Previous drafts had a badge announcing "Mechanically enforced" /
"Honour system" / "Flavour only" under the rule card. It got removed because
knowing in advance whether a rule has teeth defeats the entire exercise —
you're supposed to find out by trying something and seeing if the game stops
you.

## Everything else in the box

- **Objections** — after any Mornington Crescent call, there's a ~25% chance
  another player objects, and if raised, a less-than-20% chance it's upheld.
  Upheld means play continues; otherwise the call stands and the game ends.
- **Computer players** — drawn each game from a roster of names
  (`src/data/computerPlayers.js`) including Graham, Barry, Tim from Buxton,
  Willie from Neasden, and a Colonel. They pause for a fake think before
  moving, and grow steadily more likely to blurt out Mornington Crescent as
  the rounds go on.
- **Scoring** — flat points per move, boosted when the active rule happens
  to be a scoring rule whose condition the engine can check. A win adds a
  bonus. Feeds a top-ten table.
- **The map** — a real Leaflet/OpenStreetMap view of Greater London, with a
  numbered pin and connecting line for every move played, in order.
- **Retired stations** — a toggle at game start includes closed/disused
  stations (and the deliberately-fictional entries like Knip) in play.
- **Commentary** — a running feed of invented, deadpan lines
  (`data/commentary.json`) in the style of radio sports commentary. None of
  it refers to anything that's actually happening.

## Running it locally

Standard Laragon setup: point Apache's document root at this folder so
`http://localhost/api/*.php` resolves, then run the frontend separately:

```
npm install
npm run dev
```

The PHP API (`api/highscores.php`, fronted by the shared `api/cors.php`) is
the only dynamic part — everything else (`data/stations.json`,
`data/rules.json`, `data/commentary.json`) is bundled at build time.
`data/highscores.json` is the flat-file top ten; there's no database.

`public/.config.json` holds the tunable constants (AI thinking delay,
objection odds, MC-call probability curve, commentary pacing).

## Content credits

- Station data: 496 entries sourced from the TfL Unified API, plus 19
  hand-added landmarks and hospitals (marked `special: true` in
  `data/stations.json`) that aren't real Underground stations but are part
  of the lore or the tribute.
- Rules: paraphrased from the ISIHAC Mornington Crescent variations pages
  (credited by name in `data/rules.json`, not copied verbatim), plus thin
  h2g2/Wikipedia stubs fleshed out, plus originals written for this project.
- Commentary: entirely invented nonsense.

## Author & licence

Written by **Simon Rundell** as a wholly unnecessary but very enjoyable side
project.

This project — the app itself, and the original rules/commentary/landmark
entries — is released under
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
(CC BY-NC-SA 4.0): share and adapt it, with credit, for non-commercial
purposes, under the same licence. See [LICENSE](LICENSE) for the short
version. Station data is sourced from the TfL Unified API and ISIHAC-derived
rule descriptions are paraphrased, not copied — see "Content credits" above.

## A note on Rule 12a

Rule 12a states that Rule 12 no longer applies. In fact, neither does Rule 12a.
