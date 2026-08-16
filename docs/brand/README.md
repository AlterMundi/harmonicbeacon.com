# Harmonic Beacon brand reference

This directory preserves the human and visual reference supplied for the
current Harmonic Beacon identity.

- [`BRANDING.md`](./BRANDING.md) explains the palette, typography, symbol,
  components, motion and voice.
- [`branding_card.pdf`](./branding_card.pdf) is the one-page visual card.

The executable source of truth remains [`assets/hb-brand.css`](../../assets/hb-brand.css)
for tokens/components and [`assets/hb-main.js`](../../assets/hb-main.js) for the
canonical Lissajous mark and shared chrome. Downstream applications such as
Listener and Live should consume a pinned, verified token/asset snapshot rather
than independently reinterpret the brand.

