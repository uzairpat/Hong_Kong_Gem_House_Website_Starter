PAGE 7 — GLOBAL PRESENCE UPDATE

Files:
- GlobalPresencePage.tsx (replacement for src/pages/GlobalPresencePage.tsx)
- GlobalPresencePage.css (place in src/pages/ beside the TSX file)

The TSX imports its accompanying CSS automatically.

Expected public asset paths:
public/assets/07-global-presence/
  global-map-hero-background.png
  global-reach-background-only.png
  global-hong-kong.jpg
  global-bangkok.jpg
  global-sri-lanka.jpg
  icons/
    global-icon-hong-kong.png
    global-icon-bangkok.png
    global-icon-sri-lanka.png

The component uses the existing LineIcon names already used in the project:
location, building, globe, diamond, handshake, chart.

Important: the component removes the old Global Presence contact CTA strip because it is not part of the supplied reference design. The shared header/navigation is not changed.
