# GaiaVerity — Claude Instructions

## Design Context

### Project
**GaiaVerity** — A gardening and lawn care resource for people who want to work with their land, not against it. Built on Astro + Tailwind CSS + MDX, served via Cloudflare Workers.

---

### Users
Three overlapping types who all share one quality — they want **real answers, not marketing**:

1. **Casual home gardeners** — They want a nice yard but aren't hobbyists. They Googled "why does my lawn have mushrooms" and ended up here. Practical, impatient with jargon, grateful for clear answers.
2. **Eco-conscious suburbanites** — Care about native plants, avoiding chemicals, sustainability. Will read longer if the content earns their trust.
3. **Engaged hobbyist gardeners** — Want to go deeper. Will follow a link to research, appreciate nuance.

**Context of use**: Typically on desktop or mobile, often mid-task (in the garden or planning a weekend project). National audience — suburban and urban backyard gardeners across all US climates and soil types.

**Job to be done**: Find trustworthy, place-specific gardening advice without wading through generic, region-agnostic content.

---

### Brand Personality
**Trustworthy · Unhurried · Curious**

- **Trustworthy**: Every claim is grounded in horticultural research. No hype, no "miracle" solutions. The brand earns credibility through specificity and honesty about limitations.
- **Unhurried**: Gardening runs on seasonal rhythms. The site should never feel rushed, clickbaity, or anxious. Long-form is fine. Whitespace is generous.
- **Curious**: Loves the science — the fungi that enrich soil, the reason a specific ground cover outcompetes weeds. Intellectual warmth, not dry authority.

**Emotional target**: After reading, the user should feel **calm and connected to nature** — like a mindful pause from screens. Not overwhelmed, not sold to.

---

### Aesthetic Direction
**Earthy / textured — organic warmth, not sanitized minimalism.**

Reference feel: organic textures, warm neutrals, natural photography. Think aged linen, backyard soil, dappled garden light — universally earthy, not regionally specific.

**Established design tokens** (do not override without reason):
```
Colors (gaia.*):
  ink:        #03000d   — near-black body text
  soil:       #2d2a24   — warm dark brown
  dark:       #173404   — deep forest green (CTAs, headings)
  mid:        #3B6D11   — medium forest green (primary interactive)
  border:     #639922   — lighter green (borders, accents)
  light:      #97C459   — bright green (hover states, tags)
  pale:       #EAF3DE   — very light green (backgrounds, chips)
  paper:      #f5f5d3   — warm off-white (card backgrounds, email section)
  sage:       #a1b5a8   — muted sage green (secondary accents)
  tan:        #cbb093   — warm tan
  terracotta: #dfa477   — terracotta accent
  cream:      #f5dfc5   — warm cream

Typography:
  Headlines/UI: Cabin Variable (font-sans) — humanist, warm, grounded
  Body/editorial: Fraunces Variable (font-serif) — optical variable serif, distinctive, slightly quirky

Layout:
  Max reading width: 720px
  Approach: narrow column, generous vertical rhythm
```

**Anti-references**: Generic big-box garden center aesthetic (Home Depot FAQ feel), overly bright/cheerful gardening influencer style, anything that feels rushed.

**Theme**: Light mode only. Dark mode is configured in Tailwind but is not the design focus.

---

### Design Principles

1. **Earn the scroll.** Every section must justify the reader's time. No filler sections, no decorative complexity that doesn't serve comprehension.

2. **Nature's palette, not a brand palette.** Colors should feel like they were pulled from the garden itself — deep greens, warm soil, dry-summer straw — not from a SaaS brand guide. The `gaia.*` tokens exist to encode this; use them faithfully.

3. **Whitespace is not emptiness.** Generous spacing signals unhurried confidence. The site should breathe like an outdoor space, not pack content like a news ticker.

4. **Sans for thinking, serif for doing.** Cabin (font-sans) carries headlines, navigation, labels, and UI chrome. Fraunces (font-serif) is the body and editorial voice — long reads, quotes, pull text. Never swap them.

5. **Ecological specificity over geographic specificity.** The site serves national backyard gardeners — shady lots, clay soil, drought, poor drainage — conditions that exist everywhere. Photography and copy should be universally relatable. PNW content is an occasional spoke, not the identity.

---

### Accessibility Baseline
- Target: WCAG AA minimum for all text/background combinations
- Ensure gaia-mid (#3B6D11) on white passes contrast — verify for body-size text
- All interactive states (hover, focus, active) must be visually distinct without relying on color alone
- Motion: prefer `prefers-reduced-motion` awareness on any animations
