# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

The Bloomed marketing site at `https://studywithbloomed.com`: a single-page React + Vite +
TypeScript app, deployed as static assets through Cloudflare Workers (`wrangler.jsonc`, assets
from `dist/`). The product itself lives at `https://app.studywithbloomed.com` and is a
separate repository; every call to action here links out to it (`src/lib/links.ts`).

Commands: `npm run dev`, `npm run build` (runs `tsc` first), `npm run preview`.

## Structure

- `src/App.tsx` composes the page top to bottom: `SiteNav`, `Hero`, `TrustedBy`,
  `HowItWorks`, `ClosingCta` (which carries the `Skyline` and `SiteFooter`).
- `src/index.css` holds the design tokens (colours, type, spacing, effects, motion) copied
  verbatim from the Bloomed design system, plus every layout class and the breakpoints. Tailwind
  is still wired in but the page is written against these classes and tokens, not utilities.
- `Wordmark`, `Button`, `Icon`, `Sparkline`, `Skyline` are ports of the design system's
  components. The wordmark is the word `bloomed` in Fraunces 500, lowercase; there is no logo
  mark. `Icon` inlines the handful of Tabler glyphs the page uses so the icon webfont never ships.
- Fonts (Fraunces, Inter) load from Google Fonts in `index.html`.

## The hero animation (`src/components/HeroSession.tsx`)

The right-hand side of the hero is a real question the visitor can answer. Answering plays the
loop: reveal, the concept's mastery moving, a zoom out to the map, a handover in which the
answered tile steps back while the next one is backlit in lime, and a zoom into it. After the
last question's growth card the loop returns to the first question and plays again. The
design's three-step scan with running justifications, and a dotted-line version after it,
were both replaced at the captain's request: nothing on the map explains the choice in words. A ghost cursor answers every question after a short beat, so all
three play through unattended; the options are clickable throughout, and a real answer only
pre-empts the ghost on that question.

- Timing constants sit together near the top: `DEMO_ARM_MS`, `DEMO_TRAVEL_MS`,
  `DEMO_PRESS_MS`, `OPTION_NUDGE_MS`. The design shipped 4200 / 980 / 300 / 900 and the
  hero sat still for five seconds; the current values were chosen to have it moving inside two.
- Motion runs through the Web Animations API keyed on the element (`play()`), not through
  React state per frame, so a re-render never restarts an animation.
- The session's beats and the ghost's beats are separate timer lists, so a real click mid-demo
  drops the ghost's pending beats without touching its own.
- Option rows are keyed per question so the nudge replays on each new question.

## Leftovers

`KnowledgeGraph`, `GraphCanvas`, `src/data/` and `src/animations/` belong to the earlier
page and are kept only because the in-person `DemoKiosk` (not routed) still imports them.
`gsap`, `d3-*`, `@supabase/supabase-js` and `react-hook-form` in `package.json` are unused by
the live page for the same reason. `/privacy` and `/terms` are linked from the footer and from
the app but no route serves them yet.
