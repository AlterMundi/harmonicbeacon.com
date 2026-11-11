# Beacon material theme — review draft

Date: 2026-11-11. Status: **review candidate, not selected for publication**.

This candidate carries the owner-selected HBC material palette and revised
poster r2 into the existing Beacon website. HBC supplies a design reference;
Beacon remains a separate project with its existing symbol, content, routes,
event facts and delivery contract.

## Source and tokens

The reference HBC material stylesheet has SHA-256
`72bc83788906b1c0976a9b1e1db1d001ac03cdf6122a822d463c75f00adde0b0`.
The poster result is attributed design context, not a deployment receipt or
permission to publish another project's content.

| Token | Value | Use |
| --- | --- | --- |
| Wine | `#6d2939` | Titles, primary actions and Beacon mark |
| Deep wine | `#46202b` | Photo overlay and action hover |
| Cream | `#f7f1e7` | Main background |
| Paper | `#fffbf5` | Cards and light foreground on wine |
| Skin | `#f0d8b9` | Listening, question and book panels |
| Olive | `#5e694b` | Labels, supporting details and focus |
| Clay | `#a65442` | Secondary accent |
| Ink | `#372c28` | Body text |
| Muted | `#655951` | Supporting text |
| Line | `#d5c6b5` | Dividers and outlines |

Alegreya and Lato are served locally with their SIL OFL licenses. Small olive
labels on skin panels use wine instead to preserve text contrast. Documentary
photographs remain unchanged beneath a wine overlay.

## Scope and implementation

`assets/hb-material-theme.css` is explicitly selected in the heads of sixteen
existing Home/product-description, news, congress and registration pages. Legacy
aliases adapt their existing components; `assets/hb-brand.css` itself remains
unchanged. Other archived campaign pages and the old Logos brief are not selected.

The shared navigation stylesheet accepts optional CSS custom properties while
retaining its previous defaults for consumers without this theme. The JavaScript
outside that CSS template is byte-identical to the base revision. Home still links
to the existing Account authority; it never infers a user's session from Home.

All modified HTML bodies and script blocks are byte-identical to main. No
registration, checkout, analytics-consent, terms, API, cookie, content or event
logic changes are included. The Sunday gathering remains unpublished. Center,
Live, Account and Listen receive no code or deployment changes. The paused
Live-room/profile work is outside this candidate.

## Review and delivery

The current `ops-f-v1` contract remains in effect: GitHub Pages publishes `main:/`.
A draft branch/PR and local browser captures are review artifacts, not a public
staging environment. Do not merge this iteration as part of preparing it.

Validation covers existing tests/build/contract manifests, unchanged bodies and
controllers, desktop and narrow-screen layouts, English/Spanish language switching,
mobile menu, Account link, testimonial dialog/focus and selected page contrast.
Synthetic browsers block external analytics and writes; they do not establish a
new real registration, payment, login or human-device acceptance.

The existing Home portrait placeholders have seven `aria-label` warnings on divs
without roles. Their markup is unchanged. These remain a separate accessibility
item; palette verification is not a claim of a fully clean site-wide audit.
